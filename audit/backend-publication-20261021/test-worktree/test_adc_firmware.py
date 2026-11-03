"""Run the actual firmware sampler with a deterministic fake clock/SPI driver.

Requires a C++17 compiler (MSVC Build Tools on Windows, or c++ elsewhere).
No PCB is accessed. These tests check control flow, not physical ADC timing.
Generated C++ and executables exist only in the OS temporary directory.
"""
from pathlib import Path
import os, shutil, subprocess, tempfile

ROOT = Path(__file__).resolve().parent
source = (ROOT / 'firmware/src/main.cpp').read_text(encoding='utf-8')
globals_cpp = source[source.index('constexpr int FS='):source.index('constexpr int HISTORY_SIZE=')]
sampler_cpp = source[source.index('void IRAM_ATTR lightsOff()'):source.index('void finishBlock()')]
cancel_cpp = source[source.index('void cancelPartial()'):source.index('bool applyCommand(')]
quality_cpp = source[source.index('bool adcConstantBlock('):source.index('struct SavedRecord')]

MOCK = r'''
#include <cstdint>
#include <string>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <algorithm>
#include <cmath>
using std::sin;
using std::abs;
using std::max;
using std::min;
constexpr double PI=3.14159265358979323846;
using portMUX_TYPE=int;
constexpr int portMUX_INITIALIZER_UNLOCKED=0;
void portENTER_CRITICAL(portMUX_TYPE*){}
void portEXIT_CRITICAL(portMUX_TYPE*){}
using String=std::string;
using TaskHandle_t=void*;
struct hw_timer_t{};
struct WebServer{explicit WebServer(int){}};
using BaseType_t=int;
#define IRAM_ATTR
constexpr bool BOARD_VALIDATED=true;
constexpr int pdTRUE=1,pdFALSE=0,MSBFIRST=1,SPI_MODE0=0;
constexpr int LOW=0,HIGH=1,INPUT=1,OUTPUT=2,INPUT_PULLUP=3,INPUT_PULLDOWN=4;
constexpr uint32_t portMAX_DELAY=0xffffffff;
struct {uint32_t out_w1tc=0,out_w1ts=0;struct {uint32_t val=0;} out1_w1tc,out1_w1ts;} GPIO;
struct SPISettings {uint32_t hz;int order,mode;SPISettings(uint32_t h,int o,int m):hz(h),order(o),mode(m){}};
struct Done{};
void require(bool ok,const char* message){if(!ok)throw std::runtime_error(message);}
uint64_t clockUs=0,nextTick=0;
uint32_t pending=0;
int ownerTask=1,transfers=0,begins=0,ends=0,slowRead=0;
uint32_t slowSpiUs=0;
bool timerEnabled=false;
int pinStates[40]={},pinModes[40]={},gpioBit=0,gpioEdges=0,gpioReads=0,spiAttaches=0,spiDetaches=0;
uint16_t gpioCode=0xa55a;bool floatingLine=false;
void pinMode(int p,int mode){require(p!=19||mode!=OUTPUT,"DOUT must never be driven");pinModes[p]=mode;}
void digitalWrite(int p,int v){
 require(p!=19,"DOUT driven");
 if(p==33&&v==HIGH&&pinStates[p]==LOW)gpioBit=0;
 if(p==18&&pinStates[p]==LOW&&v==HIGH)gpioEdges++;
 if(p==18&&pinStates[p]==HIGH&&v==LOW&&pinStates[33]==LOW)gpioBit++;
 pinStates[p]=v;
}
int digitalRead(int p){
 require(p==19,"wrong data pin");gpioReads++;
 if(pinStates[33]==HIGH||floatingLine||gpioBit>=16)return pinModes[p]==INPUT_PULLUP?1:0;
 return (gpioCode>>(15-gpioBit))&1;
}
std::function<void()> onWait,onTransfer;
uint32_t micros(){return uint32_t(clockUs);}
uint32_t millis(){return uint32_t(clockUs/1000);}
int64_t esp_timer_get_time(){return int64_t(clockUs);}
void delayMicroseconds(uint32_t us){clockUs+=us;}
struct FakeSPI {
 bool open=false;
 void begin(int s,int m,int out,int cs){require(!open&&s==18&&m==19&&out==-1&&cs==-1,"wrong SPI restore");spiAttaches++;}
 void end(){require(!open,"SPI detached with open transaction");spiDetaches++;}
 void beginTransaction(SPISettings s){require(ownerTask==20&&!open,"transaction owner/start");require(s.hz==2000000&&s.mode==0&&s.order==1,"ADC SPI settings changed");open=true;begins++;}
 void endTransaction(){require(ownerTask==20&&open,"transaction released from wrong task");open=false;ends++;}
 uint16_t transfer16(int){require(ownerTask==20&&open,"sample without transaction");transfers++;clockUs+=(transfers==slowRead?slowSpiUs:8);if(onTransfer)onTransfer();return uint16_t(transfers);}
} SPI;
void timerAlarmDisable(hw_timer_t*){timerEnabled=false;}
void timerWrite(hw_timer_t*,int){nextTick=clockUs+250;}
void timerAlarmEnable(hw_timer_t*){timerEnabled=true;}
void ulTaskNotifyValueClear(TaskHandle_t,uint32_t){pending=0;}
void xTaskNotifyStateClear(TaskHandle_t){}
void xTaskNotifyGive(TaskHandle_t){pending++;}
void vTaskNotifyGiveFromISR(TaskHandle_t,BaseType_t*){pending++;}
void portYIELD_FROM_ISR(){}
uint32_t ulTaskNotifyTake(int,uint32_t){if(!pending)onWait();uint32_t n=pending;pending=0;require(n>0,"missing task notification");return n;}
'''

TESTS = r'''
void reset(uint64_t epoch=1000000){
 require(!SPI.open,"SPI leaked from prior test");clockUs=epoch;nextTick=0;pending=0;ownerTask=1;transfers=begins=ends=slowRead=0;slowSpiUs=0;timerEnabled=false;onTransfer=nullptr;
 tick=stamp=0;count=0;acquiring=completed=abortFlag=prepareRequested=adcTransactionOpen=false;timingFault=TIMING_OK;
 continuousMode=continuousEnded=continuousInterrupted=false;continuousStopped=false;continuousSamples=continuousTargetSamples=continuousProduced=continuousHead=continuousTail=0;continuousSegment=1;continuousDroppedSamples=continuousDroppedWindows=0;continuousLastSampleUs=continuousLastPublishedUs=continuousSessionStartUs=continuousSessionEndUs=0;
 maxSampleStartDelayUs=maxAdcReadDurationUs=faultTick=faultNotifications=maxConversionWindowUs=maxSpiTransferDurationUs=maxWarmupReadDurationUs=0;
 mask=0;historyReady=true;std::fill(raw,raw+N,0);std::fill(ts,ts+N,0);
 adcDiagnosticRequested=adcDiagnosticRunning=false;adcDiagnostic={};
 std::fill(pinStates,pinStates+40,0);std::fill(pinModes,pinModes+40,0);
 gpioBit=gpioEdges=gpioReads=spiAttaches=spiDetaches=0;gpioCode=0xa55a;floatingLine=false;
}
void fireTick(uint32_t late=0){require(timerEnabled,"timer not running");clockUs=nextTick;nextTick+=250;timerISR();clockUs+=late;}
void run(){ownerTask=20;try{sampleTask(nullptr);}catch(const Done&){}ownerTask=1;require(!SPI.open&&!adcTransactionOpen,"transaction leaked");}
void normalWait(uint32_t late=0){onWait=[late]{if(completed||!acquiring)throw Done{};fireTick(late);};}
void start(){ownerTask=1;beginBlock();require(acquiring&&prepareRequested&&!timerEnabled,"timer started before SPI preparation");}
void successfulBlock(){require(completed&&!abortFlag&&count==N&&timingFault==TIMING_OK,"complete block failed");require(begins==ends,"unbalanced SPI ownership");require(raw[0]==ADC_WARMUP_READS+1,"warmup contaminated raw data");require(uint32_t(ts[N-1]-ts[0])==1999750,"sample timestamps/cadence changed");require(maxConversionWindowUs==10&&maxSpiTransferDurationUs==8,"split read diagnostics incorrect");}
int main(){
 try{
 int checks=0;
 require(adcConstantBlock(N,32767,32767),"constant midscale not rejected");checks++;
 require(adcConstantBlock(N,0,0),"constant zero not identified");checks++;
 require(!adcConstantBlock(1,32767,32767),"one point misclassified as complete constant block");checks++;
 require(!adcConstantBlock(N,32767,32768),"varying codes classified constant");checks++;
 for(uint16_t code:{uint16_t(0),uint16_t(1),uint16_t(0x7fff),uint16_t(0x8000),uint16_t(0xa55a),uint16_t(0xffff)}){
  reset();gpioCode=code;require(readAdcGpio()==code,"GPIO reader bit order/first-bit error");
  require(gpioEdges==16&&gpioReads==16&&pinStates[18]==LOW&&pinStates[33]==LOW,"GPIO framing/idle state");checks++;
 }
 reset();uint8_t up=0,down=0;probeAdcDataLine(false,up,down);require(up==1&&down==0&&pinModes[19]==INPUT,"deselected DOUT pull check");checks++;
 reset();gpioCode=0x8000;probeAdcDataLine(true,up,down);require(up==1&&down==1,"selected high MSB misread");checks++;
 reset();gpioCode=0x7fff;probeAdcDataLine(true,up,down);require(up==0&&down==0,"selected low MSB misread");checks++;
 reset();floatingLine=true;probeAdcDataLine(true,up,down);require(up==1&&down==0,"floating DOUT not observable");checks++;
 reset();count=23;raw[0]=12345;ts[0]=123456;rawRecordId="saved";state="fault";fault="ADC_constant";
 adcDiagnosticRequested=adcDiagnosticRunning=true;pending=1;onWait=[]{throw Done{};};run();
 require(adcDiagnostic.ready&&!adcDiagnosticRunning&&!adcDiagnosticRequested,"diagnostic did not finish");
 require(count==23&&raw[0]==12345&&ts[0]==123456&&rawRecordId=="saved"&&fault=="ADC_constant","diagnostic altered measurement");
 require(begins==2&&ends==2&&spiAttaches==1&&spiDetaches==1&&!timerEnabled,"diagnostic SPI lifecycle");
 require(adcDiagnostic.spiBefore[0]==ADC_WARMUP_READS+1&&adcDiagnostic.spiAfter[0]==ADC_DIAGNOSTIC_SAMPLES+2*ADC_WARMUP_READS+1,"diagnostic warmup/reader order");
 for(auto code:adcDiagnostic.gpioSlow)require(code==0xa55a,"diagnostic GPIO result replaced");
 checks++;normalWait();start();run();require(completed&&!abortFlag&&count==N,"normal acquisition failed after diagnostic");checks++;
 reset();normalWait();start();run();successfulBlock();checks++;
 reset();slowRead=1;slowSpiUs=400;normalWait();start();run();successfulBlock();require(maxWarmupReadDurationUs==410&&maxAdcReadDurationUs==18,"setup time entered timed read metrics");checks++;
 reset();slowRead=ADC_WARMUP_READS+1;slowSpiUs=196;normalWait();start();run();require(completed&&abortFlag&&count==1&&timingFault==ADC_READ_TOO_LONG,"206 us regression not rejected");require(maxAdcReadDurationUs==206&&maxSpiTransferDurationUs==196,"read fault diagnostics");checks++;
 reset();slowRead=ADC_WARMUP_READS+1;slowSpiUs=190;normalWait();start();run();require(completed&&!abortFlag&&count==N&&maxAdcReadDurationUs==200,"200 us boundary changed");checks++;
 reset();normalWait(50);start();run();successfulBlock();checks++;
 reset();normalWait(51);start();run();require(completed&&abortFlag&&count==1&&timingFault==SAMPLE_START_LATE,"late start not rejected");checks++;
 reset();onWait=[]{if(completed)throw Done{};fireTick();fireTick();};start();run();require(completed&&count==0&&timingFault==NOTIFICATION_BACKLOG&&faultNotifications==2,"notification backlog not rejected");checks++;
 reset();onWait=[]{if(completed)throw Done{};fireTick();tick++;};start();run();require(completed&&count==0&&timingFault==TICK_MISMATCH,"tick mismatch not rejected");checks++;
 reset();onWait=[]{if(!acquiring)throw Done{};if(count==3){ownerTask=1;cancelPartial();ownerTask=20;}else fireTick();};start();run();require(!completed&&count==0&&!timerEnabled&&ends==1,"pause failed to discard/release");checks++;
 reset();normalWait();start();cancelPartial();run();require(!completed&&count==0&&begins==0,"cancel before preparation still sampled");checks++;
 reset(0xffffffffULL-900);normalWait();start();run();successfulBlock();require(firstSampleDeviceUs>0,"64-bit sample epoch missing");checks++;
 reset();normalWait();onTransfer=[]{if(transfers==int(ADC_WARMUP_READS)+N){clockUs=nextTick;timerISR();require(!completed&&SPI.open,"ISR published buffer before SPI completion");}};start();run();require(completed&&abortFlag&&count==N&&timingFault==FINAL_SAMPLE_TIMEOUT,"final read deadline not rejected");checks++;
 reset();normalWait();start();run();successfulBlock();start();run();require(completed&&!abortFlag&&count==N&&begins==2&&ends==2,"second block/restart failed");checks++;
 std::cout<<checks<<" firmware sampler control-flow cases passed; fake hardware only.\n";
 }catch(const std::exception &e){std::cerr<<e.what()<<"\n";return 1;}
}
'''

with tempfile.TemporaryDirectory(prefix='aerosense-adc-test-') as tmp:
    tmp = Path(tmp)
    cpp = tmp / 'sampler.cpp'
    exe = tmp / ('sampler.exe' if os.name == 'nt' else 'sampler')
    cpp.write_text(MOCK + globals_cpp + quality_cpp + sampler_cpp + cancel_cpp + TESTS, encoding='utf-8')
    if os.name == 'nt':
        vswhere = Path(os.environ.get('ProgramFiles(x86)', r'C:\Program Files (x86)')) / 'Microsoft Visual Studio/Installer/vswhere.exe'
        installation = subprocess.check_output([str(vswhere), '-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Component.VC.Tools.x86.x64', '-property', 'installationPath'], text=True).strip()
        if not installation:
            raise SystemExit('Install MSVC Build Tools with the C++ workload to run this test.')
        vcvars = Path(installation) / 'VC/Auxiliary/Build/vcvars64.bat'
        build = tmp / 'build.cmd'
        build.write_text(f'@echo off\ncall "{vcvars}" >nul\nif errorlevel 1 exit /b 1\ncl /nologo /EHsc /std:c++17 "{cpp}" /Fe:"{exe}" /Fo:"{tmp / "sampler.obj"}"\nexit /b %errorlevel%\n', encoding='utf-8')
        subprocess.run(f'cmd.exe /d /s /c ""{build}""', cwd=tmp, check=True)
    else:
        compiler = shutil.which('c++')
        if not compiler:
            raise SystemExit('Install a C++17 compiler to run this test.')
        subprocess.run([compiler, '-std=c++17', str(cpp), '-o', str(exe)], cwd=tmp, check=True)
    subprocess.run([str(exe)], cwd=tmp, check=True)
