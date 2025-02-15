var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [
              {
                "channel": 1,
                "type": "texture",
                "id": "Xsf3Rn",
                "filepath": "/media/a/cbcbb5a6cfb55c36f8f021fbb0e3f69ac96339a39fa85cd96f2017a2192821b5.png",
                "sampler": {
                  "filter": "nearest",
                  "wrap": "clamp",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// \"Fractal Cartoon\" - former \"DE edge detection\" by Kali\n\n// There are no lights and no AO, only color by normals and dark edges.\n\n// update: Nyan Cat cameo, thanks to code from mu6k: https://www.shadertoy.com/view/4dXGWH\n\n\n//#define SHOWONLYEDGES\n#define NYAN \n#define WAVES\n#define BORDER\n\n#define RAY_STEPS 150\n\n#define BRIGHTNESS 1.2\n#define GAMMA 1.4\n#define SATURATION .65\n\n\n#define detail .001\n#define t iTime*.5\n\n\nconst vec3 origin=vec3(-1.,.7,0.);\nfloat det=0.0;\n\n\n// 2D rotation function\nmat2 rot(float a) {\n\treturn mat2(cos(a),sin(a),-sin(a),cos(a));\t\n}\n\n// \"Amazing Surface\" fractal\nvec4 formula(vec4 p) {\n\t\tp.xz = abs(p.xz+1.)-abs(p.xz-1.)-p.xz;\n\t\tp.y-=.25;\n\t\tp.xy*=rot(radians(35.));\n\t\tp=p*2./clamp(dot(p.xyz,p.xyz),.2,1.);\n\treturn p;\n}\n\n// Distance function\nfloat de(vec3 pos) {\n#ifdef WAVES\n\tpos.y+=sin(pos.z-t*6.)*.15; //waves!\n#endif\n\tfloat hid=0.;\n\tvec3 tpos=pos;\n\ttpos.z=abs(3.-mod(tpos.z,6.));\n\tvec4 p=vec4(tpos,1.);\n\tfor (int i=0; i<4; i++) {p=formula(p);}\n\tfloat fr=(length(max(vec2(0.),p.yz-1.5))-1.)/p.w;\n\tfloat ro=max(abs(pos.x+1.)-.3,pos.y-.35);\n\t\t  ro=max(ro,-max(abs(pos.x+1.)-.1,pos.y-.5));\n\tpos.z=abs(.25-mod(pos.z,.5));\n\t\t  ro=max(ro,-max(abs(pos.z)-.2,pos.y-.3));\n\t\t  ro=max(ro,-max(abs(pos.z)-.01,-pos.y+.32));\n\tfloat d=min(fr,ro);\n\treturn d;\n}\n\n\n// Camera path\nvec3 path(float ti) {\n\tti*=1.5;\n\tvec3  p=vec3(sin(ti),(1.-sin(ti*2.))*.5,-ti*5.)*.5;\n\treturn p;\n}\n\n// Calc normals, and here is edge detection, set to variable \"edge\"\n\nfloat edge=0.;\nvec3 normal(vec3 p) { \n\tvec3 e = vec3(0.0,det*5.,0.0);\n\n\tfloat d1=de(p-e.yxx),d2=de(p+e.yxx);\n\tfloat d3=de(p-e.xyx),d4=de(p+e.xyx);\n\tfloat d5=de(p-e.xxy),d6=de(p+e.xxy);\n\tfloat d=de(p);\n\tedge=abs(d-0.5*(d2+d1))+abs(d-0.5*(d4+d3))+abs(d-0.5*(d6+d5));//edge finder\n\tedge=min(1.,pow(edge,.55)*15.);\n\treturn normalize(vec3(d1-d2,d3-d4,d5-d6));\n}\n\n\n// Used Nyan Cat code by mu6k, with some mods\n\nvec4 rainbow(vec2 p)\n{\n\tfloat q = max(p.x,-0.1);\n\tfloat s = sin(p.x*7.0+t*70.0)*0.08;\n\tp.y+=s;\n\tp.y*=1.1;\n\t\n\tvec4 c;\n\tif (p.x>0.0) c=vec4(0,0,0,0); else\n\tif (0.0/6.0<p.y&&p.y<1.0/6.0) c= vec4(255,43,14,255)/255.0; else\n\tif (1.0/6.0<p.y&&p.y<2.0/6.0) c= vec4(255,168,6,255)/255.0; else\n\tif (2.0/6.0<p.y&&p.y<3.0/6.0) c= vec4(255,244,0,255)/255.0; else\n\tif (3.0/6.0<p.y&&p.y<4.0/6.0) c= vec4(51,234,5,255)/255.0; else\n\tif (4.0/6.0<p.y&&p.y<5.0/6.0) c= vec4(8,163,255,255)/255.0; else\n\tif (5.0/6.0<p.y&&p.y<6.0/6.0) c= vec4(122,85,255,255)/255.0; else\n\tif (abs(p.y)-.05<0.0001) c=vec4(0.,0.,0.,1.); else\n\tif (abs(p.y-1.)-.05<0.0001) c=vec4(0.,0.,0.,1.); else\n\t\tc=vec4(0,0,0,0);\n\tc.a*=.8-min(.8,abs(p.x*.08));\n\tc.xyz=mix(c.xyz,vec3(length(c.xyz)),.15);\n\treturn c;\n}\n\nvec4 nyan(vec2 p)\n{\n\tvec2 uv = p*vec2(0.4,1.0);\n\tfloat ns=3.0;\n\tfloat nt = iTime*ns; nt-=mod(nt,240.0/256.0/6.0); nt = mod(nt,240.0/256.0);\n\tfloat ny = mod(iTime*ns,1.0); ny-=mod(ny,0.75); ny*=-0.05;\n\tvec4 color = texture(iChannel1,vec2(uv.x/3.0+210.0/256.0-nt+0.05,.5-uv.y-ny));\n\tif (uv.x<-0.3) color.a = 0.0;\n\tif (uv.x>0.2) color.a=0.0;\n\treturn color;\n}\n\n\n// Raymarching and 2D graphics\n\nvec3 raymarch(in vec3 from, in vec3 dir) \n\n{\n\tedge=0.;\n\tvec3 p, norm;\n\tfloat d=100.;\n\tfloat totdist=0.;\n\tfor (int i=0; i<RAY_STEPS; i++) {\n\t\tif (d>det && totdist<25.0) {\n\t\t\tp=from+totdist*dir;\n\t\t\td=de(p);\n\t\t\tdet=detail*exp(.13*totdist);\n\t\t\ttotdist+=d; \n\t\t}\n\t}\n\tvec3 col=vec3(0.);\n\tp-=(det-d)*dir;\n\tnorm=normal(p);\n#ifdef SHOWONLYEDGES\n\tcol=1.-vec3(edge); // show wireframe version\n#else\n\tcol=(1.-abs(norm))*max(0.,1.-edge*.8); // set normal as color with dark edges\n#endif\t\t\n\ttotdist=clamp(totdist,0.,26.);\n\tdir.y-=.02;\n\tfloat sunsize=7.-max(0.,texture(iChannel0,vec2(.6,.2)).x)*5.; // responsive sun size\n\tfloat an=atan(dir.x,dir.y)+iTime*1.5; // angle for drawing and rotating sun\n\tfloat s=pow(clamp(1.0-length(dir.xy)*sunsize-abs(.2-mod(an,.4)),0.,1.),.1); // sun\n\tfloat sb=pow(clamp(1.0-length(dir.xy)*(sunsize-.2)-abs(.2-mod(an,.4)),0.,1.),.1); // sun border\n\tfloat sg=pow(clamp(1.0-length(dir.xy)*(sunsize-4.5)-.5*abs(.2-mod(an,.4)),0.,1.),3.); // sun rays\n\tfloat y=mix(.45,1.2,pow(smoothstep(0.,1.,.75-dir.y),2.))*(1.-sb*.5); // gradient sky\n\t\n\t// set up background with sky and sun\n\tvec3 backg=vec3(0.5,0.,1.)*((1.-s)*(1.-sg)*y+(1.-sb)*sg*vec3(1.,.8,0.15)*3.);\n\t\t backg+=vec3(1.,.9,.1)*s;\n\t\t backg=max(backg,sg*vec3(1.,.9,.5));\n\t\n\tcol=mix(vec3(1.,.9,.3),col,exp(-.004*totdist*totdist));// distant fading to sun color\n\tif (totdist>25.) col=backg; // hit background\n\tcol=pow(col,vec3(GAMMA))*BRIGHTNESS;\n\tcol=mix(vec3(length(col)),col,SATURATION);\n#ifdef SHOWONLYEDGES\n\tcol=1.-vec3(length(col));\n#else\n\tcol*=vec3(1.,.9,.85);\n#ifdef NYAN\n\tdir.yx*=rot(dir.x);\n\tvec2 ncatpos=(dir.xy+vec2(-3.+mod(-t,6.),-.27));\n\tvec4 ncat=nyan(ncatpos*5.);\n\tvec4 rain=rainbow(ncatpos*10.+vec2(.8,.5));\n\tif (totdist>8.) col=mix(col,max(vec3(.2),rain.xyz),rain.a*.9);\n\tif (totdist>8.) col=mix(col,max(vec3(.2),ncat.xyz),ncat.a*.9);\n#endif\n#endif\n\treturn col;\n}\n\n// get camera position\nvec3 move(inout vec3 dir) {\n\tvec3 go=path(t);\n\tvec3 adv=path(t+.7);\n\tfloat hd=de(adv);\n\tvec3 advec=normalize(adv-go);\n\tfloat an=adv.x-go.x; an*=min(1.,abs(adv.z-go.z))*sign(adv.z-go.z)*.7;\n\tdir.xy*=mat2(cos(an),sin(an),-sin(an),cos(an));\n    an=advec.y*1.7;\n\tdir.yz*=mat2(cos(an),sin(an),-sin(an),cos(an));\n\tan=atan(advec.x,advec.z);\n\tdir.xz*=mat2(cos(an),sin(an),-sin(an),cos(an));\n\treturn go;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 uv = fragCoord.xy / iResolution.xy*2.-1.;\n\tvec2 oriuv=uv;\n\tuv.y*=iResolution.y/iResolution.x;\n\tvec2 mouse=(iMouse.xy/iResolution.xy-.5)*3.;\n\tif (iMouse.z<1.) mouse=vec2(0.,-0.05);\n\tfloat fov=.9-max(0.,.7-iTime*.3);\n\tvec3 dir=normalize(vec3(uv*fov,1.));\n\tdir.yz*=rot(mouse.y);\n\tdir.xz*=rot(mouse.x);\n\tvec3 from=origin+move(dir);\n\tvec3 color=raymarch(from,dir); \n\t#ifdef BORDER\n\tcolor=mix(vec3(0.),color,pow(max(0.,.95-length(oriuv*oriuv*oriuv*vec2(1.05,1.1))),.3));\n\t#endif\n\tfragColor = vec4(color,1.);\n}",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": true,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "XsBXWt",
          "date": "1383783069",
          "viewed": 105320,
          "name": "Fractal Land",
          "username": "Kali",
          "description": ":D",
          "likes": 1123,
          "published": 3,
          "flags": 8,
          "usePreview": 1,
          "tags": [
            "fractal",
            "cartoon"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);