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
const int LED[4]={25,26,27,32};
volatile uint32_t tick=0,stamp=0;volatile bool acquiring=false,completed=false,abortFlag=false;
uint16_t raw[N];uint32_t ts[N];
int freq[4]={41,67,89,113},phase[4]={0,0,0,0},duty=25,mask=15;
TaskHandle_t sampler=nullptr;hw_timer_t* timer=nullptr;WebServer http(80);
String state="idle",fault="",latest="null",lastCommand="";
int count=0,intervalSec=3,remaining=0;uint32_t nextStart=0,sequence=0;
String bootId,outbox[8],lastAck="";int outCount=0;
void IRAM_ATTR lightsOff(){GPIO.out_w1tc=(1UL<<25)|(1UL<<26)|(1UL<<27);GPIO.out1_w1tc.val=1;}
void IRAM_ATTR timerISR(){
 if(!acquiring)return;
 if(tick>=N){acquiring=false;lightsOff();return;}
 stamp=micros();
 for(int j=0;j<4;j++){
  phase[j]=(phase[j]+freq[j])%FS;
  bool on=(mask&(1<<j)) && phase[j]<FS*duty/100;
  if(LED[j]<32){if(on)GPIO.out_w1ts=1UL<<LED[j];else GPIO.out_w1tc=1UL<<LED[j];}
  else {if(on)GPIO.out1_w1ts.val=1;else GPIO.out1_w1tc.val=1;}
 }
 tick++;BaseType_t wake=pdFALSE;vTaskNotifyGiveFromISR(sampler,&wake);if(wake)portYIELD_FROM_ISR();
}
void sampleTask(void*){
 for(;;){uint32_t notifications=ulTaskNotifyTake(pdTRUE,portMAX_DELAY);
  if(!acquiring)continue;
  uint32_t k=tick;
  if(notifications!=1 || k!=(uint32_t)count+1 || abortFlag){abortFlag=true;acquiring=false;lightsOff();completed=true;continue;}
  uint32_t now=micros();ts[count]=now;
  digitalWrite(CNV,HIGH);delayMicroseconds(10); // ADS8866 tconv,max=8.8 us
  digitalWrite(CNV,LOW); // MSB valid before first rising clock
  SPI.beginTransaction(SPISettings(2000000,MSBFIRST,SPI_MODE0));raw[count]=SPI.transfer16(0);SPI.endTransaction();
  if(micros()-now>200 || now-stamp>50)abortFlag=true;
  count++;
  if(count==N || abortFlag){acquiring=false;lightsOff();completed=true;}
 }
}
void beginBlock(){
 if(!BOARD_VALIDATED && mask!=0){fault="board_not_validated";state="fault";remaining=0;return;}
 timerAlarmDisable(timer);ulTaskNotifyValueClear(sampler,0xffffffff);count=0;tick=0;abortFlag=false;completed=false;
 for(int j=0;j<4;j++)phase[j]=0;
 timerWrite(timer,0);acquiring=true;state="measuring";timerAlarmEnable(timer);
}
void finishBlock(){
 timerAlarmDisable(timer);lightsOff();completed=false;
 DynamicJsonDocument d(4096);d["id"]=bootId+"-"+String(++sequence);d["mode"]="hardware";d["sampleRateHz"]=FS;d["samples"]=count;d["dutyPercent"]=duty;d["ledMask"]=mask;
 d["batteryPercent"]=nullptr;d["cellTemperatureC"]=nullptr;d["firmware"]="AeroSense";
 int lo=65535,hi=0,rails=0;double mean=0,var=0,maxErr=0,jitter2=0,I[4]={},Q[4]={};
 for(int i=0;i<count;i++){lo=min(lo,(int)raw[i]);hi=max(hi,(int)raw[i]);rails+=(raw[i]<32 || raw[i]>65503);mean+=raw[i]*2.5/65536.;}
 if(count)mean/=count;
 for(int i=0;i<count;i++){
  double v=raw[i]*2.5/65536.-mean;var+=v*v;
  if(i){double e=(int32_t)(ts[i]-ts[i-1])-250.;maxErr=max(maxErr,abs(e));jitter2+=e*e;}
  // Reference is tied to LED DDS tick. Timing jitter is exported and invalidates bad blocks.
  for(int j=0;j<4;j++){double a=2*PI*freq[j]*(i+1)/FS;I[j]+=v*cos(a);Q[j]+=v*sin(a);}
 }
 auto fs=d.createNestedArray("frequenciesHz");auto ia=d.createNestedArray("inPhaseV");auto qa=d.createNestedArray("quadratureV");auto aa=d.createNestedArray("amplitudeV");
 for(int j=0;j<4;j++){fs.add(freq[j]);double iv=count?2*I[j]/count:0,qv=count?2*Q[j]/count:0;ia.add(iv);qa.add(qv);aa.add(sqrt(iv*iv+qv*qv));}
 bool valid=!abortFlag && count==N && rails==0 && maxErr<=50;
 d["valid"]=valid;d["adcMin"]=lo;d["adcMax"]=hi;d["railSamples"]=rails;d["meanV"]=mean;d["rmsV"]=count?sqrt(var/count):0;
 d["maxIntervalErrorUs"]=maxErr;d["rmsIntervalErrorUs"]=count>1?sqrt(jitter2/(count-1)):0;d["note"]="LED-channel amplitudes; not independently unmixed wells";
 d["error"]=abortFlag?"sample_timing_or_overrun":rails?"ADC_rail":maxErr>50?"sample_jitter":"";
 latest="";serializeJson(d,latest);
 if(strlen(CLOUD_URL)){
  if(outCount<8)outbox[outCount++]=latest;
  else {valid=false;fault="upload_queue_full";}
 }
 if(!valid){if(fault.isEmpty())fault=d["error"].as<String>();state="fault";remaining=0;}else{remaining--;state=remaining>0?"waiting":"idle";nextStart=millis()+intervalSec*1000;}
}
bool auth(){if(http.header("X-Aero-Key")==API_KEY)return true;http.send(401,"application/json","{\"error\":\"authentication_required\"}");return false;}
String status(){DynamicJsonDocument d(2048);d["state"]=state;d["mode"]="hardware";d["boardValidated"]=BOARD_VALIDATED;d["error"]=fault;d["remaining"]=remaining;d["batteryPercent"]=nullptr;d["cellTemperatureC"]=nullptr;d["latest"]=serialized(latest);String s;serializeJson(d,s);return s;}
bool applyCommand(JsonVariant d,String &error){
 String action=d["action"]|"";
 if(action=="stop"){remaining=0;abortFlag=true;acquiring=false;timerAlarmDisable(timer);lightsOff();state="idle";return true;}
 if(action!="start"){error="unknown_action";return false;}
 if(acquiring || remaining>0){error="busy";return false;}
 int n=d["blocks"]|1,dt=d["intervalSec"]|3,du=d["dutyPercent"]|25,ma=d["ledMask"]|15;
 if(n<1||n>60||dt<3||dt>300||du<1||du>50||ma<0||ma>15){error="invalid_settings";return false;}
 if(!BOARD_VALIDATED && ma!=0){error="board_not_validated";return false;}
 // Tested plan is fixed. Changing frequencies requires new harmonic and analog-bandwidth validation.
 remaining=n;intervalSec=dt;duty=du;mask=ma;fault="";nextStart=millis();state="waiting";return true;
}
bool remote(const String &path,const String &body,String &response){
 if(String(CLOUD_URL).isEmpty() || WiFi.status()!=WL_CONNECTED || acquiring)return false;
 HTTPClient h;WiFiClient plain;WiFiClientSecure secure;String url=String(CLOUD_URL)+path;
 if(url.startsWith("https://")){if(String(CLOUD_CA_PEM).isEmpty())return false;secure.setCACert(CLOUD_CA_PEM);h.begin(secure,url);}
 else {if(!ALLOW_LAN_HTTP)return false;h.begin(plain,url);}
 h.setTimeout(1500);h.addHeader("X-Device-Key",CLOUD_DEVICE_KEY);h.addHeader("Content-Type","application/json");int code=body.isEmpty()?h.GET():h.POST(body);response=h.getString();h.end();return code==200;
}
void setup(){
 Serial.begin(115200);for(int p:LED){pinMode(p,OUTPUT);digitalWrite(p,LOW);}pinMode(CNV,OUTPUT);digitalWrite(CNV,LOW);SPI.begin(SCLK_PIN,MISO_PIN,-1,-1);
 bootId=String((uint32_t)esp_random(),HEX);WiFi.mode(WIFI_AP_STA);WiFi.softAP("AeroSense",AP_PASSWORD);
 if(strlen(WIFI_SSID))WiFi.begin(WIFI_SSID,WIFI_PASSWORD);
 configTime(0,0,"pool.ntp.org");LittleFS.begin(false);
 xTaskCreatePinnedToCore(sampleTask,"adc",4096,nullptr,20,&sampler,1);timer=timerBegin(0,80,true);timerAttachInterrupt(timer,&timerISR,true);timerAlarmWrite(timer,250,true);
 const char* headers[]={"X-Aero-Key"};http.collectHeaders(headers,1);
 http.on("/api/status",HTTP_GET,[]{if(auth())http.send(200,"application/json",status());});
 http.on("/api/command",HTTP_POST,[]{if(!auth())return;DynamicJsonDocument d(1024);String err;if(deserializeJson(d,http.arg("plain"))){http.send(400,"application/json","{\"error\":\"invalid_json\"}");return;}bool ok=applyCommand(d.as<JsonVariant>(),err);http.send(ok?200:409,"application/json",ok?"{\"ok\":true}":"{\"error\":\""+err+"\"}");});
 http.on("/api/raw.csv",HTTP_GET,[]{if(!auth())return;if(acquiring){http.send(409,"text/plain","busy");return;}http.setContentLength(CONTENT_LENGTH_UNKNOWN);http.send(200,"text/csv","");http.sendContent("sample,time_us,adc_counts\n");for(int i=0;i<count;i++){http.sendContent(String(i)+","+String((uint32_t)(ts[i]-ts[0]))+","+String(raw[i])+"\n");}http.sendContent("");});
 http.onNotFound([]{String p=http.uri();if(p=="/")p="/index.html";if(p.indexOf("..")>=0||!LittleFS.exists(p)){http.send(404,"text/plain","Not found");return;}File f=LittleFS.open(p,"r");http.streamFile(f,p.endsWith(".js")?"application/javascript":p.endsWith(".css")?"text/css":"text/html");f.close();});http.begin();
 Serial.println("AeroSense AP http://192.168.4.1; upload filesystem before opening UI.");
}
void loop(){
 if(completed)finishBlock();
 // Upload retries precede the next acquisition; never discard an unacknowledged result.
 static uint32_t poll=0;
 if(!acquiring && millis()-poll>2000){poll=millis();String response;
  if(outCount){if(remote("/api/device/result",outbox[0],response)){for(int k=1;k<outCount;k++)outbox[k-1]=outbox[k];outCount--;}}
  if(remote("/api/device/poll","",response)){DynamicJsonDocument d(2048);if(!deserializeJson(d,response)&&!d["command"].isNull()){
   auto c=d["command"];String id=c["id"]|"";String err;
   if(id!=lastCommand){bool ok=applyCommand(c,err);lastCommand=id;DynamicJsonDocument ack(512);ack["id"]=id;ack["ok"]=ok;ack["error"]=err;lastAck="";serializeJson(ack,lastAck);}
   remote("/api/device/ack",lastAck,response);
  }}
 }
 http.handleClient();
 if(!acquiring&&remaining>0&&(int32_t)(millis()-nextStart)>=0){
  // Finite local sessions continue without cloud. Latest block remains locally downloadable.
  if(outCount>=8){fault="upload_queue_full";state="fault";remaining=0;}else beginBlock();
 }
 delay(1);
}
