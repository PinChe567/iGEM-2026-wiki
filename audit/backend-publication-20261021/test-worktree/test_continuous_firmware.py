"""Compile the actual continuous sampler against deterministic fake hardware.

Exercises uninterrupted timer/DDS acquisition and injected failures. This is
not a measurement of physical ESP32 execution time, ADC performance, or optics.
"""
import ast
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parent
source = (ROOT / "firmware/src/main.cpp").read_text(encoding="utf-8")
# Reuse only literal mock/fixture definitions, without executing another suite.
tree = ast.parse((ROOT / "test_adc_firmware.py").read_text(encoding="utf-8"))
literals = {
    node.targets[0].id: ast.literal_eval(node.value)
    for node in tree.body
    if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name)
    and node.targets[0].id in {"MOCK", "TESTS"}
}
mock = literals["MOCK"].replace(
    "struct Done{};", "struct Done{};\nstd::function<uint16_t()> codeSource;\nint timerEnables=0;"
).replace(
    "return uint16_t(transfers);", "return codeSource?codeSource():uint16_t(transfers);"
).replace(
    "void timerAlarmEnable(hw_timer_t*){timerEnabled=true;}",
    "void timerAlarmEnable(hw_timer_t*){timerEnabled=true;timerEnables++;}"
)
mock += "\n#include <vector>\n"
globals_cpp = source[source.index("constexpr int FS="):source.index("constexpr int HISTORY_SIZE=")]
quality_cpp = source[source.index("bool adcConstantBlock("):source.index("struct SavedRecord")]
sampler_cpp = source[source.index("void IRAM_ATTR lightsOff()"):source.index("void finishBlock()")]
cancel_cpp = source[source.index("void cancelPartial()"):source.index("bool applyCommand(")]
helpers = literals["TESTS"].split("int main(){", 1)[0]

checks = r'''
std::vector<ContinuousWindow> captured;
void drain(){while(continuousTail!=continuousHead){captured.push_back(continuousQueue[continuousTail%CONTINUOUS_QUEUE_SIZE]);continuousTail++;}}
void configure(int windows=5,uint64_t epoch=1000000){
 reset(epoch);captured.clear();timerEnables=0;continuousMode=true;remaining=totalBlocks=windows;mask=15;
 codeSource=[](){return uint16_t(std::lround(12000+600*std::cos(2*PI*41*tick/FS)+200*std::sin(2*PI*67*tick/FS)));};
 onWait=[](){drain();if(continuousEnded||!acquiring)throw Done{};fireTick();};
}
void verifyWindow(const ContinuousWindow &w){
 require(w.samples==N&&w.adcMin<w.adcMax&&!w.timing&&!w.lowRails&&!w.highRails,"invalid complete window");
 require(w.lastUs-w.firstUs==1999750&&w.maxError==0,"window sample timestamps changed");
 double mean=w.sum/N,i0=2*(w.I[0]-mean*w.cosSum[0])/N,q1=2*(w.Q[1]-mean*w.sinSum[1])/N;
 require(std::abs(i0-600*2.5/65536.)<2e-6&&std::abs(q1-200*2.5/65536.)<2e-6,"streaming I/Q differs from analytic waveform");
 for(int j=0;j<4;j++)if(j!=0)require(std::abs(2*(w.I[j]-mean*w.cosSum[j])/N)<2e-6,"unexpected in-phase channel mixing");
}
int main(){try{int checks=0;
 configure();start();run();drain();
 require(captured.size()==5&&continuousProduced==5&&count==N,"continuous windows missing");
 require(transfers==5*N+ADC_WARMUP_READS&&begins==1&&ends==1&&timerEnables==1,"window boundary restarted ADC/timer");
 for(size_t j=0;j<captured.size();j++){verifyWindow(captured[j]);require(captured[j].block==j+1&&captured[j].segment==1&&captured[j].gapBeforeUs==0,"window indexing/gap wrong");if(j)require(captured[j].firstUs-captured[j-1].lastUs==250,"scheduled gap inserted");}
 require(captured[0].warmupDuration>0&&captured[1].warmupDuration==0,"warmup repeated between windows");checks++;

 configure(60);start();run();drain();require(captured.size()==60&&continuousProduced==60&&continuousSamples==480000,"120-second trace truncated");
 require(timerEnables==1&&begins==1&&ends==1,"long trace timer restarted");verifyWindow(captured.back());checks++;

 configure(10);onWait=[](){if(continuousEnded||!acquiring)throw Done{};fireTick();};start();run();
 require(continuousDroppedWindows==1&&timingFault==SUMMARY_QUEUE_FULL&&!acquiring&&continuousEnded,"queue overflow not explicit/safely stopped");
 require(continuousHead-continuousTail==CONTINUOUS_QUEUE_SIZE&&continuousProduced==4,"queue overwritten silently");drain();require(captured.front().block==1&&captured.back().block==4,"overflow corrupted retained windows");checks++;

 configure();onWait=[](){drain();if(continuousEnded||!acquiring)throw Done{};fireTick(51);};start();run();drain();
 require(captured.size()==1&&captured[0].samples==1&&captured[0].timing==SAMPLE_START_LATE,"late continuous sample not retained/rejected");checks++;

 configure();slowRead=ADC_WARMUP_READS+N+1;slowSpiUs=196;start();run();drain();
 require(captured.size()==2&&captured[0].samples==N&&captured[1].samples==1&&captured[1].timing==ADC_READ_TOO_LONG,"second-window read failure lost");checks++;

 configure();onWait=[](){drain();if(continuousEnded||!acquiring)throw Done{};fireTick();fireTick();};start();run();drain();
 require(captured.empty()&&continuousDroppedWindows==1&&timingFault==NOTIFICATION_BACKLOG,"zero-sample backlog must be explicit without a fictitious trace span");checks++;

 configure();onWait=[](){drain();if(!acquiring)throw Done{};if(continuousSamples==N+17){ownerTask=1;cancelPartial();ownerTask=20;}else fireTick();};start();run();drain();
 require(captured.size()==1&&continuousDroppedSamples==17&&continuousInterrupted&&count==0&&!timerEnabled,"pause did not account for partial samples");
 auto previousLast=captured.back().lastUs;continuousSegment++;remaining=4;clockUs+=1000000;
 onWait=[](){drain();if(continuousEnded||!acquiring)throw Done{};fireTick();};start();run();drain();
 require(captured.size()==5&&captured[1].segment==2&&captured[1].block==2,"resume lost session/window identity");
 require(captured[1].gapBeforeUs==captured[1].firstUs-previousLast-250&&captured[1].gapBeforeUs>1000000,"resume gap hidden");
 require(begins==2&&ends==2&&timerEnables==2,"resume transaction lifecycle wrong");checks++;

 configure(5,0xffffffffULL-900);start();run();drain();
 require(captured.size()==5&&captured.back().firstUs>int64_t(0xffffffffULL),"64-bit continuous timestamp wrapped");verifyWindow(captured.back());checks++;

 configure();onTransfer=[](){if(transfers==int(ADC_WARMUP_READS)+5*N){clockUs=nextTick;timerISR();require(!continuousEnded&&SPI.open,"ISR published before ADC transaction completion");}};start();run();drain();
 require(captured.size()==5&&captured.back().timing==FINAL_SAMPLE_TIMEOUT&&abortFlag,"final continuous deadline not rejected");checks++;

 configure();historyReady=false;beginBlock();require(!acquiring&&!prepareRequested&&!timerEnabled&&remaining==0,"history allocation failure allowed data loss");checks++;
 std::cout<<checks<<" continuous sampler cases passed; fake hardware only.\n";
}catch(const std::exception &e){std::cerr<<e.what()<<"\n";return 1;}}
'''

with tempfile.TemporaryDirectory(prefix="aerosense-continuous-test-") as name:
    temporary = Path(name)
    cpp = temporary / "continuous.cpp"
    exe = temporary / ("continuous.exe" if os.name == "nt" else "continuous")
    cpp.write_text(mock + globals_cpp + quality_cpp + sampler_cpp + cancel_cpp + helpers + checks, encoding="utf-8")
    if os.name == "nt":
        vswhere = Path(os.environ.get("ProgramFiles(x86)", r"C:\Program Files (x86)")) / "Microsoft Visual Studio/Installer/vswhere.exe"
        installation = subprocess.check_output([str(vswhere), "-latest", "-products", "*", "-requires", "Microsoft.VisualStudio.Component.VC.Tools.x86.x64", "-property", "installationPath"], text=True).strip()
        vcvars = Path(installation) / "VC/Auxiliary/Build/vcvars64.bat"
        build = temporary / "build.cmd"
        build.write_text(f'@echo off\ncall "{vcvars}" >nul\nif errorlevel 1 exit /b 1\ncl /nologo /EHsc /std:c++17 "{cpp}" /Fe:"{exe}" /Fo:"{temporary / "continuous.obj"}"\nexit /b %errorlevel%\n', encoding="utf-8")
        subprocess.run(f'cmd.exe /d /s /c ""{build}""', cwd=temporary, check=True)
    else:
        subprocess.run([shutil.which("c++") or "c++", "-std=c++17", str(cpp), "-o", str(exe)], cwd=temporary, check=True)
    result = subprocess.run([str(exe)], cwd=temporary, check=True, text=True, capture_output=True)
    print(result.stdout.strip())
    # Exercise the actual record serializer with the real ArduinoJson library.
    # Only Arduino String construction is adapted to std::string on this host.
    saved_struct = source[source.index("struct SavedRecord {"):source.index("// Allocate before Wi-Fi starts:")]
    serializer = source[source.index("void recordJson("):source.index("void rememberRecord(")].replace("String(", "toArduinoString(")
    serialization_cpp = r'''
#include <ArduinoJson.h>
#include <cstdint>
#include <cstring>
#include <iostream>
#include <string>
#include <stdexcept>
constexpr int FS=4000,N=8000,ADC_WARMUP_READS=4,ADC_SPI_HZ=2000000;
constexpr char FIRMWARE_REVISION[]="native-continuous-fixture";
int freq[]={41,67,89,113};std::string bootId="boot-test";
struct {const char* macAddress(){return "fixture-device";}} WiFi;
std::string toArduinoString(uint32_t n){return std::to_string(n);}
std::string toArduinoString(int n){return std::to_string(n);}
bool adcConstantBlock(int samples,int lo,int hi){return samples==N&&lo==hi;}
''' + saved_struct + serializer + r'''
int main(){try{
 SavedRecord r={};r.seq=60;r.session=3;r.block=r.total=60;r.period=2;r.samples=8000;r.duty=25;r.mask=15;r.adcMin=1000;r.adcMax=20000;r.valid=r.continuous=true;r.segment=1;r.windowStartMs=118000.25;r.windowEndMs=120000.;r.deviceTimeMs=(r.windowStartMs+r.windowEndMs)/2;
 std::memset(r.label,'"',240);r.label[240]=0;
 DynamicJsonDocument d(4096);recordJson(r,d);
 if(d.overflowed())throw std::runtime_error("record exceeds firmware JSON capacity");
 std::string wire;serializeJson(d,wire);DynamicJsonDocument parsed(8192);
 if(deserializeJson(parsed,wire)||parsed["samples"].as<int>()!=8000||parsed["acquisitionMode"].as<std::string>()!="continuous"||!parsed["sessionComplete"].as<bool>()||parsed["windowEndDeviceTimeMs"].as<double>()!=120000.||parsed["bootId"].as<std::string>()!="boot-test")throw std::runtime_error("continuous metadata lost in JSON");
 r.segment=2;r.interrupted=true;r.droppedSamples=17;recordJson(r,d);
 if(d["sessionComplete"].as<bool>()||!d["sessionInterrupted"].as<bool>()||d["droppedPartialSamples"].as<int>()!=17)throw std::runtime_error("interruption metadata lost");
 std::cout<<"Serializer capacity and continuity fields passed; history heap "<<60*sizeof(SavedRecord)<<" bytes on native ABI.\n";
 }catch(const std::exception& e){std::cerr<<e.what()<<"\n";return 1;}}
'''
    cpp.write_text(serialization_cpp, encoding="utf-8")
    include = ROOT / "firmware/.pio/libdeps/esp32dev/ArduinoJson/src"
    if os.name == "nt":
        build.write_text(f'@echo off\ncall "{vcvars}" >nul\nif errorlevel 1 exit /b 1\ncl /nologo /EHsc /std:c++17 /I"{include}" "{cpp}" /Fe:"{exe}" /Fo:"{temporary / "continuous.obj"}"\nexit /b %errorlevel%\n', encoding="utf-8")
        subprocess.run(f'cmd.exe /d /s /c ""{build}""', cwd=temporary, check=True)
    else:
        subprocess.run([shutil.which("c++") or "c++", "-std=c++17", "-I", str(include), str(cpp), "-o", str(exe)], cwd=temporary, check=True)
    serialized = subprocess.run([str(exe)], cwd=temporary, check=True, text=True, capture_output=True)
    print(serialized.stdout.strip())
    (ROOT / "evidence/continuous_firmware_tests.json").write_text(json.dumps({
        "passed": True, "checks": 11,
        "method": "Actual firmware sampler compiled with fake clock/SPI; no physical timing or optical claim",
        "cases": ["uninterrupted five windows and analytic I/Q", "120-second bounded capture", "queue overflow stops without overwrite", "late sample rejection", "read failure at second-window boundary", "notification backlog evidence", "pause/resume gap and discarded-sample accounting", "64-bit clock wrap", "final sample deadline and SPI ownership", "history allocation failure prevents capture", "real ArduinoJson serializer capacity and continuity metadata"],
    }, indent=2) + "\n", encoding="utf-8")
