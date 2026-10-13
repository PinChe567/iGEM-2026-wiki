"""Render only the new four-filter movie. No original movie is modified."""
from pathlib import Path
import json
import subprocess
import hashlib
import struct
import numpy as np
from PIL import Image, ImageDraw, ImageFont

CODE=Path(__file__).resolve().parent
P=CODE.parent
O=CODE/'data'
F=P/'figures'
WIDTH,HEIGHT,FPS,FRAMES=2530,1190,10,200
LABELS=['No filter','LEE 101: 1 layer','LEE 101: 2 layers','500 nm OD4: 1 layer*']
KEYS=['none','lee101_1','lee101_2','edmund_29190_scenario']
FREQ=np.array([89.,113.,41.,67.])


def font(size,bold=False):
    path=Path('C:/Windows/Fonts')/('segoeuib.ttf' if bold else 'segoeui.ttf')
    return ImageFont.truetype(str(path),size)


def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()


def limits(values):
    lo,hi=float(np.min(values)),float(np.max(values))
    pad=max((hi-lo)*.10,.005)
    return min(0,lo-pad),hi+pad


def frame(data,k):
    im=Image.new('RGB',(WIDTH,HEIGHT),'#f4f7fb');d=ImageDraw.Draw(im)
    d.text((30,17),'Four detector filters | received, ideal and residual',font=font(30,True),fill='#12263d')
    sample=4*k;t=sample/4000
    d.text((30,59),f'Physical time {t*1000:6.1f} ms  |  100x slow playback  |  Each panel has its own scale',font=font(20),fill='#334155')
    for j,q in enumerate(['NE','NW','SW','SE']):
        on=bool(data['gates'][sample,j]);x=1190+j*175
        d.ellipse((x,26,x+18,44),fill='#2563eb' if on else '#cbd5e1')
        d.text((x+26,22),f'{q} {FREQ[j]:.0f} Hz',font=font(19),fill='#334155')
    d.text((30,94),'Orange: received raw     Green: ideal after filter     Gray dashed: ideal before filter',font=font(19),fill='#334155')
    d.text((1040,94),'Purple: raw residual     Blue: blank-corrected AC',font=font(19),fill='#334155')
    titles=['RAW + TWO IDEAL COMPARATORS','RAW MINUS FILTERED IDEAL','AFTER BLANK: FOUR AC FUNDAMENTALS','CORRECTED AC RESIDUAL, MAGNIFIED (pA)']
    for c,title in enumerate(titles):d.text((30+c*625,129),title,font=font(18,True),fill='#12263d')
    end=801
    for row in range(4):
        y=160+row*236
        series=[[(data['raw'][row],'#ea7b18',2,False),(data['ideal_pre'],'#94a3b8',2,True),(data['ideal'][row],'#16804a',2,False)],
                [(data['residual'][row],'#7e22ce',2,False)],
                [(data['corrected_fundamental'][row],'#2563eb',2,False),(data['ideal_fundamental'][row],'#16804a',2,True)],
                [(1000*data['corrected_residual_fundamental'][row],'#be185d',2,False)]]
        for col,arr in enumerate(series):
            x=25+col*625
            d.rounded_rectangle((x,y,x+607,y+224),radius=10,fill='white',outline='#d8e1ec')
            d.text((x+13,y+7),LABELS[row],font=font(19,True),fill='#172a43')
            if col==0:
                d.text((x+247,y+10),f'raw {data["raw"][row,sample]:.3f} nA',font=font(16),fill='#a54b00')
            elif col==1:
                d.text((x+247,y+10),f'residual {data["residual"][row,sample]:.3f} nA',font=font(16),fill='#7e22ce')
            elif col==2:
                error=float(np.sqrt(np.mean(data['corrected_residual_fundamental'][row]**2)))
                d.text((x+247,y+10),f'AC error RMS {error:.5f} nA',font=font(15),fill='#2563eb')
            else:
                error=float(np.sqrt(np.mean(data['corrected_residual_fundamental'][row]**2)))*1000
                d.text((x+247,y+10),f'AC error RMS {error:.3f} pA',font=font(16),fill='#be185d')
            left,right,top,bottom=x+70,x+584,y+46,y+183
            lo,hi=limits(np.concatenate([a[0][:end] for a in arr]))
            for val in np.linspace(lo,hi,4):
                yy=bottom-(val-lo)/(hi-lo)*(bottom-top)
                d.line((left,yy,right,yy),fill='#e8edf4')
                d.text((x+5,yy-9),f'{val:.2f}',font=font(14),fill='#64748b')
            for val in [0,50,100,150,200]:
                xx=left+val/200*(right-left)
                d.line((xx,top,xx,bottom),fill='#e8edf4')
                d.text((xx-10,bottom+4),str(val),font=font(14),fill='#64748b')
            d.text((x+12,y+198),'pA' if col==3 else 'nA',font=font(14),fill='#64748b')
            d.text((x+526,y+198),'ms',font=font(14),fill='#64748b')
            for vals,color,width,dashed in arr:
                xx=left+data['t'][:sample+1]/.2*(right-left)
                yy=bottom-(vals[:sample+1]-lo)/(hi-lo)*(bottom-top)
                points=list(zip(xx,yy))
                if len(points)>1:
                    if dashed:
                        for st in range(0,len(points)-1,10):d.line(points[st:min(st+6,len(points))],fill=color,width=width)
                    else:d.line(points,fill=color,width=width)
                else:d.ellipse((xx[0]-2,yy[0]-2,xx[0]+2,yy[0]+2),fill=color)
            cursor=left+t/.2*(right-left)
            d.line((cursor,top,cursor,bottom),fill='#162c45',width=1)
    d.text((30,1110),'*OD4 curve is a constructed scenario, not a measured curve. Green emission is an assumed GCaMP-like shape.',font=font(20),fill='#334155')
    d.text((30,1143),'Blank correction uses independent 5 x 2 s records and an offline 2 s I/Q fit. AC panels omit DC and PWM harmonics.',font=font(20),fill='#334155')
    return im


def mp4_info(path):
    data=path.read_bytes();found={}
    def walk(start,end):
        p=start
        while p+8<=end:
            size,kind=struct.unpack_from('>I4s',data,p)
            if size<8:break
            payload=p+8;stop=p+size
            if kind in [b'moov',b'trak',b'mdia',b'minf',b'stbl']:walk(payload,stop)
            if kind==b'mvhd':
                version=data[payload]
                if version==0:scale,duration=struct.unpack_from('>II',data,payload+12)
                else:scale=struct.unpack_from('>I',data,payload+20)[0];duration=struct.unpack_from('>Q',data,payload+24)[0]
                found['duration_s']=duration/scale
            if kind==b'stsz':found['frame_count']=struct.unpack_from('>I',data,payload+8)[0]
            p=stop
    walk(0,len(data));return found


def video(data,record):
    (P/'videos').mkdir(exist_ok=True)
    import imageio_ffmpeg
    ffmpeg=imageio_ffmpeg.get_ffmpeg_exe()
    target=P/'videos/filter_signal_comparison.mp4'
    args=[ffmpeg,'-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{WIDTH}x{HEIGHT}',
          '-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',str(target)]
    proc=subprocess.Popen(args,stdin=subprocess.PIPE)
    alignment=[]
    try:
        for k in range(FRAMES):
            im=frame(data,k);proc.stdin.write(im.tobytes())
            sample=4*k
            alignment.append(dict(frame=k,sample=sample,physical_time_s=sample/4000,
                                  LED_gates=data['gates'][sample].astype(int).tolist(),
                                  raw_nA=data['raw'][:,sample].tolist(),ideal_nA=data['ideal'][:,sample].tolist(),
                                  residual_nA=data['residual'][:,sample].tolist()))
    finally:proc.stdin.close()
    assert proc.wait()==0,'MP4 encoding failed'
    info=mp4_info(target)
    assert info['frame_count']==FRAMES and info['duration_s']==20
    assert all(a['sample']==4*a['frame'] for a in alignment)
    previews=[]  # Reproduction does not create duplicate QA screenshots.
    (O/'filter_comparison_frame_alignment.json').write_text(json.dumps(alignment,indent=2),encoding='utf-8')
    v=json.loads((O/'filter_comparison_validation.json').read_text(encoding='utf-8'))
    v['video']=dict(path=target.name,sha256=sha(target),**info,fps=FPS,dimensions=[WIDTH,HEIGHT],
                    physical_time_range_s=[0,.199],last_frame_holds_to_s=.200,slowdown=100,
                    all_panels_share_sample_index=True,history_only_trace_display=True,
                    AC_coefficients='Offline fit to full 2 s; the animation is not an online estimator.',
                    decoded_previews=previews,visual_review='Pending explicit review of decoded start/middle/end frames.')
    (O/'filter_comparison_validation.json').write_text(json.dumps(v,indent=2),encoding='utf-8')
    print('New movie:',target,'frames:',info)


if __name__=='__main__':
    data=dict(np.load(O/'filter_comparison_traces.npz'))
    record=json.loads((O/'filter_comparison_summary.json').read_text(encoding='utf-8'))
    video(data,record)
