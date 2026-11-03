// ESP32-WROOM-32E / vendor NTHU schematic sheet 2. No invented sensors.
// Finite 2 s acquisition blocks; hardware timer DDS and timestamped ADC samples.
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <LittleFS.h>
#include <ArduinoJson.h>
#include <soc/gpio_struct.h>
#include <esp_timer.h>
#if __has_include("aerosense_config.h")
#include "aerosense_config.h"
#else
#include "config.example.h"
#endif
constexpr int FS=4000,N=8000,CNV=33,MISO_PIN=19,SCLK_PIN=18;
constexpr char FIRMWARE_REVISION[]="2026-10-21-continuous1";
constexpr uint32_t ADC_SPI_HZ=2000000,ADC_WARMUP_READS=4;
const int LED[4]={25,26,27,32};
volatile uint32_t tick=0,stamp=0;volatile bool acquiring=false,completed=false,abortFlag=false;
volatile bool prepareRequested=false;
// Only sampleTask opens/closes this transaction. Never hand a FreeRTOS mutex
// from the Arduino loop task to the sampler task.
bool adcTransactionOpen=false;
volatile int count=0;bool filesystemReady=false,historyReady=false;
enum TimingFault : uint8_t { TIMING_OK, NOTIFICATION_BACKLOG, TICK_MISMATCH, ADC_READ_TOO_LONG, SAMPLE_START_LATE, FINAL_SAMPLE_TIMEOUT, SUMMARY_QUEUE_FULL };
volatile TimingFault timingFault=TIMING_OK;
volatile uint32_t maxSampleStartDelayUs=0,maxAdcReadDurationUs=0,faultTick=0,faultNotifications=0;
volatile uint32_t maxConversionWindowUs=0,maxSpiTransferDurationUs=0,maxWarmupReadDurationUs=0;
uint16_t raw[N];uint32_t ts[N];
volatile int64_t firstSampleDeviceUs=0;
int freq[4]={41,67,89,113},phase[4]={0,0,0,0},duty=25,mask=15;
TaskHandle_t sampler=nullptr;hw_timer_t* timer=nullptr;WebServer http(80);
String state="idle",fault="",latest="null",lastCommand="";
int periodSec=60,remaining=0,totalBlocks=0,finishedBlocks=0;uint32_t nextStart=0,sequence=0,blockStartMs=0,sessionSequence=0;
String bootId,outbox[8],lastAck="";int outCount=0;
String sampleLabel="",rawRecordId="";
bool paused=false;
// Continuous mode keeps the ADC transaction, timer and LED DDS running between
// two-second windows. Only sufficient statistics are queued, never heap/JSON.
constexpr int CONTINUOUS_QUEUE_SIZE=4,CONTINUOUS_MAX_SECONDS=120;
volatile bool continuousMode=false,continuousEnded=false,continuousInterrupted=false;
bool continuousStopped=false;
volatile uint32_t continuousSamples=0,continuousTargetSamples=0,continuousProduced=0;
volatile uint32_t continuousSegment=1,continuousDroppedSamples=0,continuousDroppedWindows=0;
int continuousDurationSec=0;
int64_t continuousLastSampleUs=0,continuousLastPublishedUs=0,continuousSessionStartUs=0,continuousSessionEndUs=0;
float referenceSin[FS];bool referenceReady=false;
struct ContinuousWindow {
 uint32_t block=0,segment=1,startDelay=0,readDuration=0,conversionDuration=0,spiDuration=0,warmupDuration=0,faultTick=0,faultNotifications=0;
 int samples=0,adcMin=65535,adcMax=0,lowRails=0,highRails=0,timing=0,jitterIntervals=0;
 int64_t firstUs=0,lastUs=0,gapBeforeUs=0;
 double sum=0,sumSquares=0,maxError=0,jitterSquares=0,I[4]={},Q[4]={},cosSum[4]={},sinSum[4]={};
};
ContinuousWindow continuousAccumulator,continuousQueue[CONTINUOUS_QUEUE_SIZE];
volatile uint32_t continuousHead=0,continuousTail=0;
portMUX_TYPE continuousMux=portMUX_INITIALIZER_UNLOCKED;
constexpr int ADC_DIAGNOSTIC_SAMPLES=32,ADC_LINE_PROBES=4;
volatile bool adcDiagnosticRequested=false,adcDiagnosticRunning=false;
struct AdcDiagnostic {
 bool ready=false;
 uint32_t sequence=0,startedMs=0,durationMs=0;
 char label[241]={};
 uint16_t spiBefore[ADC_DIAGNOSTIC_SAMPLES]={},gpioSlow[ADC_DIAGNOSTIC_SAMPLES]={},spiAfter[ADC_DIAGNOSTIC_SAMPLES]={};
 uint8_t deselectedUp[ADC_LINE_PROBES]={},deselectedDown[ADC_LINE_PROBES]={},selectedUp[ADC_LINE_PROBES]={},selectedDown[ADC_LINE_PROBES]={};
};
AdcDiagnostic adcDiagnostic;
constexpr int HISTORY_SIZE=60;
// A constant complete hardware block does not establish ADC/PD response.
// Retain the measured code; never replace it with noise or an assumed voltage.
bool adcConstantBlock(int samples,int lo,int hi){return samples==N && lo==hi;}
struct SavedRecord {
 uint32_t seq,session,block,startMs,period,total,startDelay,readDuration,faultTick,faultNotifications;
 uint32_t conversionDuration,spiDuration,warmupDuration;
 int samples,duty,mask,adcMin,adcMax,lowRails,highRails,timing;
 bool valid,queueFull;
 bool continuous,interrupted;
 uint32_t segment,droppedSamples;
 double windowStartMs,windowEndMs,gapBeforeUs;
 double deviceTimeMs,mean,rms,maxError,rmsError,I[4],Q[4],A[4];
 char label[241];
};
// Allocate before Wi-Fi starts: the ESP32 static DRAM linker region is smaller
// than its total internal heap. Retention is fixed at sixty summaries.
SavedRecord* history=nullptr;int historyCount=0,historyHead=0;
void recordJson(const SavedRecord &r,JsonDocument &d){
 d.clear();d["id"]=bootId+"-"+String(r.seq);d["mode"]="hardware";
 d["sampleRateHz"]=FS;d["samples"]=r.samples;d["dutyPercent"]=r.duty;d["ledMask"]=r.mask;
 d["batteryPercent"]=nullptr;d["cellTemperatureC"]=nullptr;d["firmware"]="AeroSense";d["deviceId"]=WiFi.macAddress();
 d["firmwareRevision"]=FIRMWARE_REVISION;
 const char* names[]={"","notification_backlog","tick_mismatch","adc_read_too_long","sample_start_late","final_sample_timeout","continuous_summary_queue_full"};
 d["timingFault"]=names[r.timing];d["maxSampleStartDelayUs"]=r.startDelay;d["maxAdcReadDurationUs"]=r.readDuration;d["faultTick"]=r.faultTick;d["faultNotifications"]=r.faultNotifications;
 d["maxConversionWindowUs"]=r.conversionDuration;d["maxSpiTransferDurationUs"]=r.spiDuration;d["maxWarmupReadDurationUs"]=r.warmupDuration;
 d["adcWarmupReadsDiscarded"]=r.continuous&&!r.warmupDuration?0:ADC_WARMUP_READS;d["adcSpiClockHz"]=ADC_SPI_HZ;
 d["bootId"]=bootId;d["processingSchema"]=2;d["iqConvention"]="I_cos_Q_sin_peak_V";
 d["acquisitionSignature"]="DDS4k_IQ8000_ADC2p5V_v2_adc2_41_67_89_113_duty"+String(r.duty)+"_mask"+String(r.mask);
 if(r.samples)d["deviceTimeMs"]=r.deviceTimeMs;else d["deviceTimeMs"]=nullptr;
 d["deviceTimeMeaning"]="monotonic acquisition midpoint; bootId defines clock epoch";
 d["sessionId"]=bootId+"-s"+String(r.session);d["blockIndex"]=r.block;d["plannedBlocks"]=r.total;
 d["periodSec"]=r.period;d["blockStartMs"]=r.startMs;d["conditionTag"]=r.label;
 d["acquisitionMode"]=r.continuous?"continuous":"interval";
 if(r.continuous){d["continuousVersion"]=1;d["continuousSegment"]=r.segment;d["sessionInterrupted"]=r.interrupted;d["droppedPartialSamples"]=r.droppedSamples;d["windowStartDeviceTimeMs"]=r.windowStartMs;d["windowEndDeviceTimeMs"]=r.windowEndMs;d["gapBeforeUs"]=r.gapBeforeUs;d["sessionComplete"]=r.valid&&r.block==r.total&&!r.interrupted;d["rawRetention"]="latest complete window only; session trace consists of two-second I/Q summaries";}
 auto f=d.createNestedArray("frequenciesHz"),i=d.createNestedArray("inPhaseV"),q=d.createNestedArray("quadratureV"),a=d.createNestedArray("amplitudeV");
 for(int j=0;j<4;j++){f.add(freq[j]);i.add(r.I[j]);q.add(r.Q[j]);a.add(r.A[j]);}
 d["valid"]=r.valid;d["adcMin"]=r.adcMin;d["adcMax"]=r.adcMax;d["lowRailSamples"]=r.lowRails;d["highRailSamples"]=r.highRails;d["railSamples"]=r.lowRails+r.highRails;
 d["adcCodeSpan"]=r.samples?r.adcMax-r.adcMin:0;d["adcConstant"]=adcConstantBlock(r.samples,r.adcMin,r.adcMax);
 d["meanV"]=r.mean;d["rmsV"]=r.rms;d["maxIntervalErrorUs"]=r.maxError;d["rmsIntervalErrorUs"]=r.rmsError;
 d["note"]="LED-channel amplitudes; not independently unmixed wells";
 d["error"]=r.queueFull?"upload_queue_full":r.timing?"sample_timing_or_overrun":r.lowRails+r.highRails?"ADC_rail":r.maxError>50?"sample_jitter":adcConstantBlock(r.samples,r.adcMin,r.adcMax)?"ADC_constant":"";
}
void rememberRecord(JsonDocument &d){
 SavedRecord &r=history[historyHead];r={};r.seq=sequence;r.session=sessionSequence;r.block=finishedBlocks+1;r.total=totalBlocks;r.startMs=blockStartMs;r.period=periodSec;
 r.samples=count;r.duty=duty;r.mask=mask;r.adcMin=d["adcMin"];r.adcMax=d["adcMax"];r.lowRails=d["lowRailSamples"];r.highRails=d["highRailSamples"];r.timing=timingFault;
 r.valid=d["valid"];r.queueFull=String(d["error"]|"")=="upload_queue_full";r.mean=d["meanV"];r.rms=d["rmsV"];r.maxError=d["maxIntervalErrorUs"];r.rmsError=d["rmsIntervalErrorUs"];r.deviceTimeMs=d["deviceTimeMs"];
 r.startDelay=maxSampleStartDelayUs;r.readDuration=maxAdcReadDurationUs;r.faultTick=faultTick;r.faultNotifications=faultNotifications;
 r.conversionDuration=maxConversionWindowUs;r.spiDuration=maxSpiTransferDurationUs;r.warmupDuration=maxWarmupReadDurationUs;
 for(int j=0;j<4;j++){r.I[j]=d["inPhaseV"][j];r.Q[j]=d["quadratureV"][j];r.A[j]=d["amplitudeV"][j];}
 strlcpy(r.label,sampleLabel.c_str(),sizeof(r.label));historyHead=(historyHead+1)%HISTORY_SIZE;historyCount=min(historyCount+1,HISTORY_SIZE);
 recordJson(r,d);
}
void diagnosticReaderJson(JsonObject o,const uint16_t* values){
 int lo=65535,hi=0;uint32_t sum=0;auto a=o.createNestedArray("rawCodes");
 for(int i=0;i<ADC_DIAGNOSTIC_SAMPLES;i++){int v=values[i];a.add(v);lo=min(lo,v);hi=max(hi,v);sum+=v;}
 o["samples"]=ADC_DIAGNOSTIC_SAMPLES;o["min"]=lo;o["max"]=hi;o["span"]=hi-lo;o["meanCounts"]=double(sum)/ADC_DIAGNOSTIC_SAMPLES;
}
void diagnosticJson(JsonObject d){
 d["schema"]="aerosense-adc-diagnostic-1";d["id"]=bootId+"-adc-"+String(adcDiagnostic.sequence);
 d["firmwareRevision"]=FIRMWARE_REVISION;d["conditionTag"]=adcDiagnostic.label;
 d["startedMs"]=adcDiagnostic.startedMs;d["durationMs"]=adcDiagnostic.durationMs;d["ledMask"]=0;
 d["cnvGpio"]=CNV;d["sclkGpio"]=SCLK_PIN;d["doutGpio"]=MISO_PIN;d["hardwareSpiHz"]=ADC_SPI_HZ;
 d["gpioHalfClockDelayUs"]=2;d["gpioConversionWaitUs"]=12;
 d["note"]="LED-off diagnostic, sequential readers, not a calibrated optical measurement. GPIO delay is a minimum, not a measured clock rate. Original measurement and raw CSV are unchanged.";
 diagnosticReaderJson(d.createNestedObject("spiBefore"),adcDiagnostic.spiBefore);
 diagnosticReaderJson(d.createNestedObject("gpioSlow"),adcDiagnostic.gpioSlow);
 diagnosticReaderJson(d.createNestedObject("spiAfter"),adcDiagnostic.spiAfter);
 auto lines=d.createNestedObject("dataLine");
 auto du=lines.createNestedArray("cnvHighPullUp"),dd=lines.createNestedArray("cnvHighPullDown"),su=lines.createNestedArray("cnvLowPullUp"),sd=lines.createNestedArray("cnvLowPullDown");
 for(int i=0;i<ADC_LINE_PROBES;i++){du.add(adcDiagnostic.deselectedUp[i]);dd.add(adcDiagnostic.deselectedDown[i]);su.add(adcDiagnostic.selectedUp[i]);sd.add(adcDiagnostic.selectedDown[i]);}
 lines["meaning"]="Weak ESP32 input pulls only. CNV high should release DOUT. CNV low after conversion should drive the MSB. Pull-following while selected suggests an undriven input; it does not identify a failed component.";
}
void IRAM_ATTR lightsOff(){GPIO.out_w1tc=(1UL<<25)|(1UL<<26)|(1UL<<27);GPIO.out1_w1tc.val=1;}
void IRAM_ATTR timerISR(){
 if(!acquiring || abortFlag)return;
 // A delayed final ADC task must produce a rejected block, not leave the UI stuck.
 if(tick>=(continuousMode?continuousTargetSamples:uint32_t(N))){
  timingFault=FINAL_SAMPLE_TIMEOUT;faultTick=tick;abortFlag=true;lightsOff();
  // The sampler must finish any in-flight read and release its SPI transaction
  // before the loop is allowed to analyse/export the buffer.
  BaseType_t wake=pdFALSE;vTaskNotifyGiveFromISR(sampler,&wake);if(wake)portYIELD_FROM_ISR();return;
 }
 stamp=micros();
 for(int j=0;j<4;j++){
  phase[j]=(phase[j]+freq[j])%FS;
  bool on=(mask&(1<<j)) && phase[j]<FS*duty/100;
  if(LED[j]<32){if(on)GPIO.out_w1ts=1UL<<LED[j];else GPIO.out_w1tc=1UL<<LED[j];}
  else {if(on)GPIO.out1_w1ts.val=1;else GPIO.out1_w1tc.val=1;}
 }
 tick++;BaseType_t wake=pdFALSE;vTaskNotifyGiveFromISR(sampler,&wake);if(wake)portYIELD_FROM_ISR();
}
uint16_t IRAM_ATTR readAdc(uint32_t &conversionUs,uint32_t &spiUs){
 uint32_t started=micros();
 GPIO.out1_w1ts.val=1UL<<(CNV-32);
 delayMicroseconds(10); // ADS8866 maximum conversion time is 8.8 us.
 GPIO.out1_w1tc.val=1UL<<(CNV-32);
 uint32_t transferStarted=micros();
 uint16_t value=SPI.transfer16(0); // MODE0, MSB first; transaction already owned.
 uint32_t finished=micros();
 conversionUs=transferStarted-started;spiUs=finished-transferStarted;
 return value;
}
void endAdcBlock(bool publish){
 timerAlarmDisable(timer);acquiring=false;lightsOff();
 if(adcTransactionOpen){SPI.endTransaction();adcTransactionOpen=false;}
 if(publish)completed=true;
}
// Manual diagnostic only. DOUT always remains an input. These functions never
// write the measurement buffer, change its validity, or replace the 4 kHz reader.
uint16_t readAdcGpio(){
 digitalWrite(SCLK_PIN,LOW);digitalWrite(CNV,LOW);delayMicroseconds(2);
 digitalWrite(CNV,HIGH);delayMicroseconds(12);
 digitalWrite(CNV,LOW);delayMicroseconds(2);
 uint16_t value=0;
 for(int bit=0;bit<16;bit++){
  digitalWrite(SCLK_PIN,HIGH);delayMicroseconds(2);
  value=(value<<1)|(digitalRead(MISO_PIN)?1:0);
  digitalWrite(SCLK_PIN,LOW);delayMicroseconds(2);
 }
 return value;
}
void probeAdcDataLine(bool selected,uint8_t &up,uint8_t &down){
 digitalWrite(CNV,LOW);delayMicroseconds(12);
 digitalWrite(CNV,HIGH);delayMicroseconds(12);
 if(selected){digitalWrite(CNV,LOW);delayMicroseconds(2);}
 pinMode(MISO_PIN,INPUT_PULLUP);delayMicroseconds(50);up=digitalRead(MISO_PIN)?1:0;
 pinMode(MISO_PIN,INPUT_PULLDOWN);delayMicroseconds(50);down=digitalRead(MISO_PIN)?1:0;
 pinMode(MISO_PIN,INPUT);digitalWrite(CNV,LOW);delayMicroseconds(12);
}
void diagnosticSpiReads(uint16_t* values){
 SPI.beginTransaction(SPISettings(ADC_SPI_HZ,MSBFIRST,SPI_MODE0));adcTransactionOpen=true;
 for(int i=-int(ADC_WARMUP_READS);i<ADC_DIAGNOSTIC_SAMPLES;i++){
  uint32_t conversionUs,spiUs;uint16_t v=readAdc(conversionUs,spiUs);
  if(i>=0)values[i]=v;
  delayMicroseconds(5);
 }
 SPI.endTransaction();adcTransactionOpen=false;
}
void runAdcDiagnostic(){
 timerAlarmDisable(timer);lightsOff();adcDiagnostic.ready=false;adcDiagnostic.startedMs=millis();
 diagnosticSpiReads(adcDiagnostic.spiBefore);
 SPI.end();pinMode(SCLK_PIN,OUTPUT);digitalWrite(SCLK_PIN,LOW);pinMode(MISO_PIN,INPUT);
 for(int i=0;i<ADC_LINE_PROBES;i++){
  probeAdcDataLine(false,adcDiagnostic.deselectedUp[i],adcDiagnostic.deselectedDown[i]);
  probeAdcDataLine(true,adcDiagnostic.selectedUp[i],adcDiagnostic.selectedDown[i]);
 }
 pinMode(MISO_PIN,INPUT);
 for(int i=0;i<ADC_DIAGNOSTIC_SAMPLES;i++)adcDiagnostic.gpioSlow[i]=readAdcGpio();
 digitalWrite(CNV,LOW);digitalWrite(SCLK_PIN,LOW);pinMode(MISO_PIN,INPUT);
 SPI.begin(SCLK_PIN,MISO_PIN,-1,-1);diagnosticSpiReads(adcDiagnostic.spiAfter);
 adcDiagnostic.durationMs=millis()-adcDiagnostic.startedMs;adcDiagnostic.ready=true;
 adcDiagnosticRunning=false;
}
void prepareAdcBlock(){
 SPI.beginTransaction(SPISettings(ADC_SPI_HZ,MSBFIRST,SPI_MODE0));adcTransactionOpen=true;
 lightsOff();
 // Exercise the ADC/driver path before the timer starts. These four LED-off
 // reads are setup only: they never enter raw[], the 8,000 samples or I/Q.
 for(uint32_t i=0;i<ADC_WARMUP_READS && acquiring && !abortFlag;i++){
  uint32_t conversionUs,spiUs,started=micros();readAdc(conversionUs,spiUs);
  uint32_t duration=micros()-started;
  if(duration>maxWarmupReadDurationUs)maxWarmupReadDurationUs=duration;
 }
 if(!acquiring || abortFlag){endAdcBlock(false);return;}
 blockStartMs=millis();timerWrite(timer,0);timerAlarmEnable(timer);
}
void resetContinuousWindow(){
 continuousAccumulator=ContinuousWindow{};
 maxSampleStartDelayUs=maxAdcReadDurationUs=maxConversionWindowUs=maxSpiTransferDurationUs=0;
 timingFault=TIMING_OK;faultTick=faultNotifications=0;
}
bool publishContinuousWindow(){
 ContinuousWindow &w=continuousAccumulator;
 w.block=continuousProduced+1;w.segment=continuousSegment;w.samples=count;
 w.startDelay=maxSampleStartDelayUs;w.readDuration=maxAdcReadDurationUs;
 w.conversionDuration=maxConversionWindowUs;w.spiDuration=maxSpiTransferDurationUs;w.warmupDuration=maxWarmupReadDurationUs;
 w.timing=timingFault;w.faultTick=faultTick;w.faultNotifications=faultNotifications;
 bool queued=false;
 portENTER_CRITICAL(&continuousMux);
 if(continuousHead-continuousTail<CONTINUOUS_QUEUE_SIZE){continuousQueue[continuousHead%CONTINUOUS_QUEUE_SIZE]=w;continuousHead++;queued=true;}
 portEXIT_CRITICAL(&continuousMux);
 if(queued){continuousProduced++;if(w.samples==N)continuousLastPublishedUs=w.lastUs;}
 else{continuousDroppedWindows++;timingFault=SUMMARY_QUEUE_FULL;abortFlag=true;}
 return queued;
}
void endContinuousSampling(bool publish){
 // The last ADC read has completed. Stop the timer and release its transaction
 // before copying the final summary so an interrupt cannot alter its fault
 // metadata while it is being published. Intermediate windows never use this.
 endAdcBlock(false);
 if(publish){if(count>0)publishContinuousWindow();else continuousDroppedWindows++;}
 continuousSessionEndUs=esp_timer_get_time();continuousEnded=true;
}
void accumulateContinuousSample(int64_t sampleTime,uint16_t code,uint32_t sampleTick){
 ContinuousWindow &w=continuousAccumulator;
 if(count==0){w.firstUs=sampleTime;w.gapBeforeUs=continuousLastSampleUs?sampleTime-continuousLastSampleUs-250:0;if(!continuousSessionStartUs)continuousSessionStartUs=sampleTime;}
 if(continuousLastSampleUs){
  double error=double(sampleTime-continuousLastSampleUs)-250.;
  // A resumed segment records its gap, but it is not a missed ADC tick inside
  // this new segment. Its sessionInterrupted marker remains set permanently.
  if(count>0||continuousSamples>0){w.maxError=max(w.maxError,abs(error));w.jitterSquares+=error*error;w.jitterIntervals++;}
 }
 continuousLastSampleUs=sampleTime;w.lastUs=sampleTime;
 w.adcMin=min(w.adcMin,int(code));w.adcMax=max(w.adcMax,int(code));w.lowRails+=code<32;w.highRails+=code>65503;
 double value=code*2.5/65536.;w.sum+=value;w.sumSquares+=value*value;
 for(int j=0;j<4;j++){
  // Same integer DDS phase as timerISR, without per-sample trigonometry.
  int phaseIndex=(sampleTick*uint32_t(freq[j]))%FS;
  double s=referenceSin[phaseIndex],c=referenceSin[(phaseIndex+FS/4)%FS];
  w.I[j]+=value*c;w.Q[j]+=value*s;w.cosSum[j]+=c;w.sinSum[j]+=s;
 }
}
void sampleTask(void*){
 for(;;){uint32_t notifications=ulTaskNotifyTake(pdTRUE,portMAX_DELAY);
  if(adcDiagnosticRequested){adcDiagnosticRequested=false;runAdcDiagnostic();continue;}
  if(prepareRequested){prepareRequested=false;prepareAdcBlock();continue;}
  if(!acquiring){endAdcBlock(false);continue;}
  uint32_t k=tick,triggerStamp=stamp;
  if(notifications!=1 || k!=(continuousMode?continuousSamples:uint32_t(count))+1 || k!=tick || abortFlag){
   if(timingFault==TIMING_OK)timingFault=notifications!=1?NOTIFICATION_BACKLOG:TICK_MISMATCH;
   faultTick=k;faultNotifications=notifications;abortFlag=true;if(continuousMode)endContinuousSampling(true);else endAdcBlock(true);continue;
  }
  // micros() uses this same clock. Read it once for both timestamp widths;
  // the first timed sample no longer has a separate first-use clock call.
  int64_t sampleTime=esp_timer_get_time();uint32_t now=(uint32_t)sampleTime,startDelay=now-triggerStamp;
  if(startDelay>maxSampleStartDelayUs)maxSampleStartDelayUs=startDelay;
  ts[count]=now;if(count==0)firstSampleDeviceUs=sampleTime;
  uint32_t conversionUs,spiUs;raw[count]=readAdc(conversionUs,spiUs);
  if(conversionUs>maxConversionWindowUs)maxConversionWindowUs=conversionUs;
  if(spiUs>maxSpiTransferDurationUs)maxSpiTransferDurationUs=spiUs;
  uint32_t readDuration=micros()-now;
  if(readDuration>maxAdcReadDurationUs)maxAdcReadDurationUs=readDuration;
  // Use the captured trigger time. A later interrupt can replace the global stamp.
  if(readDuration>200 || startDelay>50){
   if(timingFault==TIMING_OK)timingFault=readDuration>200?ADC_READ_TOO_LONG:SAMPLE_START_LATE;
   faultTick=k;faultNotifications=notifications;abortFlag=true;
  }
  if(continuousMode)accumulateContinuousSample(sampleTime,raw[count],k);
  count++;
  if(continuousMode){
   continuousSamples++;
   if(count==N||abortFlag){
    const auto &w=continuousAccumulator;
    bool bad=abortFlag||w.lowRails||w.highRails||w.maxError>50||adcConstantBlock(count,w.adcMin,w.adcMax);
    bool final=continuousSamples>=continuousTargetSamples;
    if(bad||final){endContinuousSampling(true);continue;}
    if(!publishContinuousWindow()){endContinuousSampling(false);continue;}
    // No timer disable, LED-off, warmup or phase reset at this boundary.
    count=0;maxWarmupReadDurationUs=0;resetContinuousWindow();
   }
  }else if(count==N || abortFlag)endAdcBlock(true);
 }
}
void beginBlock(){
 if(!historyReady){fault="history_storage_unavailable";state="fault";remaining=0;return;}
 if(!BOARD_VALIDATED && mask!=0){fault="board_not_validated";state="fault";remaining=0;return;}
 timerAlarmDisable(timer);ulTaskNotifyValueClear(sampler,0xffffffff);xTaskNotifyStateClear(sampler);count=0;tick=0;firstSampleDeviceUs=0;abortFlag=false;completed=false;
 timingFault=TIMING_OK;maxSampleStartDelayUs=0;maxAdcReadDurationUs=0;faultTick=0;faultNotifications=0;
 maxConversionWindowUs=0;maxSpiTransferDurationUs=0;maxWarmupReadDurationUs=0;
 if(continuousMode){
  if(!referenceReady){for(int k=0;k<FS;k++)referenceSin[k]=sin(2*PI*k/FS);referenceReady=true;}
  continuousSamples=0;continuousTargetSamples=uint32_t(remaining)*N;continuousEnded=false;continuousSessionEndUs=0;resetContinuousWindow();
 }
 for(int j=0;j<4;j++)phase[j]=0;
 rawRecordId="";acquiring=true;state="measuring";prepareRequested=true;xTaskNotifyGive(sampler);
}
void finishBlock(){
 timerAlarmDisable(timer);lightsOff();completed=false;
 DynamicJsonDocument d(4096);d["id"]=bootId+"-"+String(++sequence);d["mode"]="hardware";d["sampleRateHz"]=FS;d["samples"]=count;d["dutyPercent"]=duty;d["ledMask"]=mask;
 d["batteryPercent"]=nullptr;d["cellTemperatureC"]=nullptr;d["firmware"]="AeroSense";d["deviceId"]=WiFi.macAddress();
 d["firmwareRevision"]=FIRMWARE_REVISION;
 const char* timingNames[]={"","notification_backlog","tick_mismatch","adc_read_too_long","sample_start_late","final_sample_timeout"};
 d["timingFault"]=timingNames[timingFault];d["maxSampleStartDelayUs"]=maxSampleStartDelayUs;
 d["maxAdcReadDurationUs"]=maxAdcReadDurationUs;d["faultTick"]=faultTick;d["faultNotifications"]=faultNotifications;
 // Raw peak I/Q remains authoritative. Browser measured-blank correction is
 // separate postprocessing; no simulated offset is applied on the ESP32.
 d["bootId"]=bootId;d["processingSchema"]=2;d["iqConvention"]="I_cos_Q_sin_peak_V";
 d["acquisitionSignature"]="DDS4k_IQ8000_ADC2p5V_v2_adc2_41_67_89_113_duty"+String(duty)+"_mask"+String(mask);
 if(count>0)d["deviceTimeMs"]=(firstSampleDeviceUs+0.5*(uint32_t)(ts[count-1]-ts[0]))/1000.0;else d["deviceTimeMs"]=nullptr;
 d["deviceTimeMeaning"]="monotonic acquisition midpoint; bootId defines clock epoch";
 int lo=65535,hi=0,rails=0,lowRails=0,highRails=0;double mean=0,var=0,maxErr=0,jitter2=0,I[4]={},Q[4]={};
 for(int i=0;i<count;i++){lo=min(lo,(int)raw[i]);hi=max(hi,(int)raw[i]);lowRails+=raw[i]<32;highRails+=raw[i]>65503;mean+=raw[i]*2.5/65536.;}rails=lowRails+highRails;
 if(count)mean/=count;
 for(int i=0;i<count;i++){
  double v=raw[i]*2.5/65536.-mean;var+=v*v;
  if(i){double e=(int32_t)(ts[i]-ts[i-1])-250.;maxErr=max(maxErr,abs(e));jitter2+=e*e;}
  // Reference is tied to LED DDS tick. Timing jitter is exported and invalidates bad blocks.
  for(int j=0;j<4;j++){double a=2*PI*freq[j]*(i+1)/FS;I[j]+=v*cos(a);Q[j]+=v*sin(a);}
 }
 auto fs=d.createNestedArray("frequenciesHz");auto ia=d.createNestedArray("inPhaseV");auto qa=d.createNestedArray("quadratureV");auto aa=d.createNestedArray("amplitudeV");
 for(int j=0;j<4;j++){fs.add(freq[j]);double iv=count?2*I[j]/count:0,qv=count?2*Q[j]/count:0;ia.add(iv);qa.add(qv);aa.add(sqrt(iv*iv+qv*qv));}
 bool constant=adcConstantBlock(count,lo,hi);
 bool valid=!abortFlag && count==N && rails==0 && maxErr<=50 && !constant;
 d["valid"]=valid;d["adcMin"]=lo;d["adcMax"]=hi;d["railSamples"]=rails;d["lowRailSamples"]=lowRails;d["highRailSamples"]=highRails;d["meanV"]=mean;d["rmsV"]=count?sqrt(var/count):0;
 d["maxIntervalErrorUs"]=maxErr;d["rmsIntervalErrorUs"]=count>1?sqrt(jitter2/(count-1)):0;d["note"]="LED-channel amplitudes; not independently unmixed wells";
 d["error"]=abortFlag?"sample_timing_or_overrun":rails?"ADC_rail":maxErr>50?"sample_jitter":constant?"ADC_constant":"";
 if(strlen(CLOUD_URL) && outCount>=8){valid=false;d["valid"]=false;d["error"]="upload_queue_full";fault="upload_queue_full";}
 rememberRecord(d);finishedBlocks++;latest="";serializeJson(d,latest);rawRecordId=d["id"].as<String>();
 if(strlen(CLOUD_URL)){
  if(outCount<8)outbox[outCount++]=latest;
  else {valid=false;fault="upload_queue_full";}
 }
 if(!valid){if(fault.isEmpty())fault=d["error"].as<String>();state="fault";remaining=0;}else{remaining--;state=remaining>0?"waiting":"idle";uint32_t planned=blockStartMs+periodSec*1000;
 // Start-to-start period. Retain at least 3 s with LEDs off; never catch up with a burst.
 uint32_t earliest=millis()+3000;nextStart=(int32_t)(planned-earliest)>0?planned:earliest;}
}
void processContinuousWindows(){
 for(;;){
  ContinuousWindow w;bool ready=false;
  portENTER_CRITICAL(&continuousMux);
  if(continuousTail!=continuousHead){w=continuousQueue[continuousTail%CONTINUOUS_QUEUE_SIZE];continuousTail++;ready=true;}
  portEXIT_CRITICAL(&continuousMux);
  if(!ready)break;
  SavedRecord &r=history[historyHead];r={};
  r.seq=++sequence;r.session=sessionSequence;r.block=w.block;r.total=totalBlocks;r.period=2;
  r.continuous=true;r.interrupted=continuousInterrupted;r.segment=w.segment;r.droppedSamples=continuousDroppedSamples;
  r.samples=w.samples;r.duty=duty;r.mask=mask;r.adcMin=w.adcMin;r.adcMax=w.adcMax;r.lowRails=w.lowRails;r.highRails=w.highRails;r.timing=w.timing;
  r.windowStartMs=w.firstUs/1000.;r.windowEndMs=w.lastUs/1000.;r.deviceTimeMs=(w.firstUs+w.lastUs)/2000.;r.startMs=uint32_t(w.firstUs/1000);r.gapBeforeUs=w.gapBeforeUs;
  r.startDelay=w.startDelay;r.readDuration=w.readDuration;r.conversionDuration=w.conversionDuration;r.spiDuration=w.spiDuration;r.warmupDuration=w.warmupDuration;r.faultTick=w.faultTick;r.faultNotifications=w.faultNotifications;
  r.mean=w.samples?w.sum/w.samples:0;r.rms=w.samples?sqrt(max(0.,w.sumSquares/w.samples-r.mean*r.mean)):0;
  r.maxError=w.maxError;r.rmsError=w.jitterIntervals?sqrt(w.jitterSquares/w.jitterIntervals):0;
  for(int j=0;j<4;j++){r.I[j]=w.samples?2*(w.I[j]-r.mean*w.cosSum[j])/w.samples:0;r.Q[j]=w.samples?2*(w.Q[j]-r.mean*w.sinSum[j])/w.samples:0;r.A[j]=sqrt(r.I[j]*r.I[j]+r.Q[j]*r.Q[j]);}
  r.valid=w.samples==N&&!w.timing&&!w.lowRails&&!w.highRails&&w.maxError<=50&&!adcConstantBlock(w.samples,w.adcMin,w.adcMax);
  strlcpy(r.label,sampleLabel.c_str(),sizeof(r.label));historyHead=(historyHead+1)%HISTORY_SIZE;historyCount=min(historyCount+1,HISTORY_SIZE);
  finishedBlocks=w.block;remaining=continuousStopped?0:max(0,totalBlocks-finishedBlocks);
  DynamicJsonDocument d(4096);recordJson(r,d);latest="";serializeJson(d,latest);
  if(!acquiring&&w.samples==count&&w.lastUs==continuousAccumulator.lastUs&&count>0)rawRecordId=d["id"].as<String>();
  if(!r.valid){fault=w.timing?"sample_timing_or_overrun":w.lowRails+w.highRails?"ADC_rail":w.maxError>50?"sample_jitter":adcConstantBlock(w.samples,w.adcMin,w.adcMax)?"ADC_constant":"incomplete_continuous_window";remaining=0;state="fault";}
 }
 if(continuousEnded){
  continuousEnded=false;
  if(timingFault==SUMMARY_QUEUE_FULL){fault="continuous_summary_queue_full";state="fault";remaining=0;}
  else if(abortFlag||timingFault!=TIMING_OK){fault="sample_timing_or_overrun";state="fault";remaining=0;}
  else if(state!="fault"&&finishedBlocks>=totalBlocks){paused=false;state="idle";remaining=0;}
  else if(state!="fault"&&!paused){state="idle";remaining=0;}
 }
}
bool auth(){if(http.header("X-Aero-Key")==API_KEY)return true;http.send(401,"application/json","{\"error\":\"authentication_required\"}");return false;}
String status(){
 DynamicJsonDocument d(12288);d["state"]=state;d["mode"]="hardware";d["deviceId"]=WiFi.macAddress();d["boardValidated"]=BOARD_VALIDATED;d["filesystemReady"]=filesystemReady;d["uploadQueue"]=outCount;d["wifiConnected"]=WiFi.status()==WL_CONNECTED;d["error"]=fault;
 d["adcDiagnosticVersion"]=1;d["adcDiagnosticRunning"]=adcDiagnosticRunning;
 if(!adcDiagnosticRunning&&adcDiagnostic.ready)diagnosticJson(d.createNestedObject("adcDiagnostic"));
 d["remaining"]=remaining;d["plannedBlocks"]=totalBlocks;d["completedBlocks"]=finishedBlocks;d["periodSec"]=periodSec;d["paused"]=paused;
 d["nextStartInSec"]=(remaining&&!paused&&!acquiring)?max(0,(int32_t)(nextStart-millis()))/1000.0:0;
 d["firmwareRevision"]=FIRMWARE_REVISION;d["scheduleVersion"]=1;d["historyCount"]=historyCount;d["historyCapacity"]=HISTORY_SIZE;
 d["continuousVersion"]=1;d["continuousMaxDurationSec"]=CONTINUOUS_MAX_SECONDS;d["acquisitionMode"]=continuousMode?"continuous":"interval";
 d["bootId"]=bootId;d["sessionId"]=bootId+"-s"+String(sessionSequence);d["durationSec"]=continuousMode?continuousDurationSec:0;
 d["continuousSegment"]=continuousSegment;d["sessionInterrupted"]=continuousMode&&continuousInterrupted;d["droppedPartialSamples"]=continuousDroppedSamples;d["droppedWindows"]=continuousDroppedWindows;
 d["deviceTimeMs"]=esp_timer_get_time()/1000.;d["elapsedSec"]=continuousMode&&continuousSessionStartUs?((continuousSessionEndUs?continuousSessionEndUs:esp_timer_get_time())-continuousSessionStartUs)/1000000.:0;
 d["historyStorageReady"]=historyReady;
 d["sessionComplete"]=continuousMode&&!acquiring&&!paused&&finishedBlocks==totalBlocks&&!continuousInterrupted&&!continuousDroppedWindows&&fault.isEmpty();
 d["historyLiveWindowLimit"]=continuousMode&&acquiring?CONTINUOUS_QUEUE_SIZE:HISTORY_SIZE;d["historyCompleteAvailable"]=!acquiring;
 d["historyLatestId"]=historyCount?bootId+"-"+String(sequence):"";d["rawRecordId"]=rawRecordId;d["rawAvailable"]=!acquiring&&count>0&&!rawRecordId.isEmpty();
 d["batteryPercent"]=nullptr;d["cellTemperatureC"]=nullptr;d["latest"]=serialized(latest);String out;serializeJson(d,out);return out;
}
void cancelPartial(){
 if(continuousMode&&acquiring){continuousInterrupted=true;continuousDroppedSamples+=uint32_t(count);continuousLastSampleUs=continuousLastPublishedUs;continuousSessionEndUs=esp_timer_get_time();}
 timerAlarmDisable(timer);bool partial=acquiring||completed;acquiring=false;prepareRequested=false;completed=false;abortFlag=true;lightsOff();
 if(partial){count=0;rawRecordId="";}
 // Wake the owning task so pause/stop releases the SPI transaction as well.
 xTaskNotifyGive(sampler);
}
bool applyCommand(JsonVariant d,String &error){
 if(continuousMode)processContinuousWindows();
 String action=d["action"]|"";
 if(adcDiagnosticRunning||adcDiagnosticRequested){error="adc_diagnostic_busy";return false;}
 if(action=="diagnoseAdc"){
  if(acquiring||completed||remaining||prepareRequested||adcTransactionOpen){error="end_schedule_before_diagnostic";return false;}
  if(!d["conditionTag"].isNull()&&!d["conditionTag"].is<const char*>()){error="invalid_sample_label";return false;}
  String label=d["conditionTag"]|"";if(label.length()>240){error="invalid_sample_label";return false;}
  adcDiagnosticRunning=true;adcDiagnostic.ready=false;adcDiagnostic.sequence++;
  strlcpy(adcDiagnostic.label,label.c_str(),sizeof(adcDiagnostic.label));
  adcDiagnosticRequested=true;xTaskNotifyGive(sampler);return true;
 }
 if(action=="stop"){if(continuousMode){continuousInterrupted=true;continuousStopped=true;}cancelPartial();remaining=0;paused=false;fault="session_stopped_partial_block_discarded";state="idle";return true;}
 if(action=="pause"){
  if(!remaining||paused){error="no_active_schedule";return false;}
  if(continuousMode)continuousInterrupted=true;cancelPartial();paused=true;state="paused";fault="";return true;
 }
 if(action=="resume"){
  if(!paused||!remaining){error="no_paused_schedule";return false;}
  if(continuousMode)continuousSegment++;paused=false;fault="";nextStart=millis()+(continuousMode?0:3000);state="waiting";return true;
 }
 if(action=="clearHistory"){
  if(acquiring||completed||remaining||adcTransactionOpen||continuousHead!=continuousTail){error="end_schedule_before_delete";return false;}
  for(int k=0;k<outCount;k++)outbox[k]="";outCount=0;
  historyCount=0;historyHead=0;latest="null";rawRecordId="";count=0;fault="";totalBlocks=0;finishedBlocks=0;continuousMode=false;continuousEnded=false;continuousDroppedSamples=continuousDroppedWindows=0;state="idle";return true;
 }
 if(action!="start"){error="unknown_action";return false;}
 if(!historyReady){error="history_storage_unavailable";return false;}
 if(acquiring||completed||remaining||adcTransactionOpen||prepareRequested||continuousEnded||continuousHead!=continuousTail){error="busy";return false;}
 for(const char* k:{"blocks","periodSec","intervalSec","durationSec","dutyPercent","ledMask"})if(!d[k].isNull()&&!d[k].is<int>()){error="integer_settings_required";return false;}
 if(!d["acquisitionMode"].isNull()&&!d["acquisitionMode"].is<const char*>()){error="invalid_acquisition_mode";return false;}
 String mode=d["acquisitionMode"]|"interval";
 if(mode!="interval"&&mode!="continuous"){error="invalid_acquisition_mode";return false;}
 int n=d["blocks"]|1,dt=d["periodSec"]|(int(d["intervalSec"]|3)+2),du=d["dutyPercent"]|25,ma=d["ledMask"]|15;
 int duration=d["durationSec"]|60;
 if(mode=="continuous"){
  if(duration<10||duration>CONTINUOUS_MAX_SECONDS||duration%2){error="continuous_duration_requires_even_10_to_120_seconds";return false;}
  // The legacy cloud outbox cannot retain sixty records while network uploads
  // are disabled during sampling. Use direct UI or the host's board bridge.
  if(strlen(CLOUD_URL)){error="continuous_requires_direct_device_bridge";return false;}
  n=duration/2;dt=2;
 }
 if(n<1||n>60||(mode!="continuous"&&dt<5)||dt>3600||du<1||du>50||ma<0||ma>15){error="invalid_settings";return false;}
 if(!d["conditionTag"].isNull()&&!d["conditionTag"].is<const char*>()){error="invalid_sample_label";return false;}
 String label=d["conditionTag"]|"";if(label.length()>240){error="invalid_sample_label";return false;}
 if(!BOARD_VALIDATED&&ma!=0){error="board_not_validated";return false;}
 continuousMode=mode=="continuous";continuousDurationSec=continuousMode?duration:0;continuousProduced=0;continuousHead=continuousTail=0;
 continuousSegment=1;continuousDroppedSamples=continuousDroppedWindows=0;continuousInterrupted=continuousStopped=false;continuousLastSampleUs=continuousLastPublishedUs=continuousSessionStartUs=continuousSessionEndUs=0;
 remaining=n;totalBlocks=n;finishedBlocks=0;periodSec=dt;duty=du;mask=ma;sampleLabel=label;sessionSequence++;paused=false;fault="";nextStart=millis();state="waiting";return true;
}
bool remote(const String &path,const String &body,String &response){
 if(String(CLOUD_URL).isEmpty() || WiFi.status()!=WL_CONNECTED || acquiring)return false;
 HTTPClient h;WiFiClient plain;WiFiClientSecure secure;String url=String(CLOUD_URL)+path;
 if(url.startsWith("https://")){if(String(CLOUD_CA_PEM).isEmpty())return false;secure.setCACert(CLOUD_CA_PEM);h.begin(secure,url);}
 else {if(!ALLOW_LAN_HTTP)return false;h.begin(plain,url);}
 h.setTimeout(1500);h.addHeader("X-Device-Key",CLOUD_DEVICE_KEY);h.addHeader("Content-Type","application/json");int code=body.isEmpty()?h.GET():h.POST(body);response=h.getString();h.end();return code==200;
}
void setup(){
 history=static_cast<SavedRecord*>(calloc(HISTORY_SIZE,sizeof(SavedRecord)));historyReady=history!=nullptr;
 Serial.begin(115200);for(int p:LED){pinMode(p,OUTPUT);digitalWrite(p,LOW);}pinMode(CNV,OUTPUT);digitalWrite(CNV,LOW);SPI.begin(SCLK_PIN,MISO_PIN,-1,-1);
 // sampleTask configures/owns SPI once per block, before starting the timer.
 bootId=String((uint32_t)esp_random(),HEX);WiFi.mode(WIFI_AP_STA);WiFi.softAP("AeroSense",AP_PASSWORD);
 if(strlen(WIFI_SSID))WiFi.begin(WIFI_SSID,WIFI_PASSWORD);
 configTime(0,0,"pool.ntp.org");filesystemReady=LittleFS.begin(false);
 xTaskCreatePinnedToCore(sampleTask,"adc",4096,nullptr,20,&sampler,1);timer=timerBegin(0,80,true);timerAttachInterrupt(timer,&timerISR,true);timerAlarmWrite(timer,250,true);
 const char* headers[]={"X-Aero-Key"};http.collectHeaders(headers,1);
 http.on("/api/status",HTTP_GET,[]{if(auth())http.send(200,"application/json",status());});
 http.on("/api/command",HTTP_POST,[]{if(!auth())return;DynamicJsonDocument d(1024);String err;if(deserializeJson(d,http.arg("plain"))){http.send(400,"application/json","{\"error\":\"invalid_json\"}");return;}bool ok=applyCommand(d.as<JsonVariant>(),err);http.send(ok?200:409,"application/json",ok?"{\"ok\":true}":"{\"error\":\""+err+"\"}");});
 http.on("/api/history",HTTP_GET,[]{
  if(!auth())return;if(acquiring&&!continuousMode){http.send(409,"application/json","{\"error\":\"busy\"}");return;}
  http.setContentLength(CONTENT_LENGTH_UNKNOWN);http.send(200,"application/json","");http.sendContent("[");
  int returned=continuousMode&&acquiring?min(historyCount,CONTINUOUS_QUEUE_SIZE):historyCount;
  DynamicJsonDocument d(4096);for(int n=0;n<returned;n++){recordJson(history[(historyHead-returned+n+HISTORY_SIZE)%HISTORY_SIZE],d);String out;serializeJson(d,out);if(n)http.sendContent(",");http.sendContent(out);}http.sendContent("]");http.sendContent("");
 });
 http.on("/api/raw.csv",HTTP_GET,[]{
  if(!auth())return;if(acquiring){http.send(409,"application/json","{\"error\":\"busy\"}");return;}
  if(rawRecordId.isEmpty()||!count){http.send(404,"application/json","{\"error\":\"raw_unavailable\"}");return;}
  if(http.hasArg("id")&&http.arg("id")!=rawRecordId){http.send(409,"application/json","{\"error\":\"raw_record_changed\"}");return;}
  http.setContentLength(CONTENT_LENGTH_UNKNOWN);http.send(200,"text/csv","");http.sendContent("record_id,sample,time_us,adc_counts,voltage_V\n");
  // Send small batches to avoid 8,000 separate HTTP chunks. Acquisition starts only after this handler returns.
  String chunk;chunk.reserve(2200);for(int i=0;i<count;i++){chunk+=rawRecordId+","+String(i)+","+String((uint32_t)(ts[i]-ts[0]))+","+String(raw[i])+","+String(raw[i]*2.5/65536.,9)+"\n";if(chunk.length()>1800){http.sendContent(chunk);chunk="";}}if(chunk.length())http.sendContent(chunk);http.sendContent("");
 });
 http.onNotFound([]{String p=http.uri();if(p=="/")p="/index.html";if(p.indexOf("..")>=0||!LittleFS.exists(p)){http.send(404,"text/plain","Not found");return;}File f=LittleFS.open(p,"r");http.streamFile(f,p.endsWith(".js")?"application/javascript":p.endsWith(".css")?"text/css":"text/html");f.close();});http.begin();
 Serial.println("AeroSense AP http://192.168.4.1; upload filesystem before opening UI.");
}
void loop(){
 if(continuousMode)processContinuousWindows();
 if(completed)finishBlock();
 // Upload retries precede the next acquisition; never discard an unacknowledged result.
 static uint32_t poll=0;
 if(!acquiring && millis()-poll>2000){poll=millis();String response;
  if(outCount){if(remote("/api/device/result",outbox[0],response)){for(int k=1;k<outCount;k++)outbox[k-1]=outbox[k];outCount--;}}
  remote("/api/device/status",status(),response);
  if(remote("/api/device/poll","",response)){DynamicJsonDocument d(2048);if(!deserializeJson(d,response)&&!d["command"].isNull()){
   auto c=d["command"];String id=c["id"]|"";String err;
   if(id!=lastCommand){bool ok=applyCommand(c,err);lastCommand=id;DynamicJsonDocument ack(512);ack["id"]=id;ack["ok"]=ok;ack["error"]=err;lastAck="";serializeJson(ack,lastAck);}
   remote("/api/device/ack",lastAck,response);
  }}
 }
 http.handleClient();
 if(!acquiring&&!adcTransactionOpen&&!prepareRequested&&!paused&&remaining>0&&(int32_t)(millis()-nextStart)>=0){
  // Finite local sessions continue without cloud. Latest block remains locally downloadable.
  if(outCount>=8){fault="upload_queue_full";state="fault";remaining=0;}else beginBlock();
 }
 delay(1);
}
