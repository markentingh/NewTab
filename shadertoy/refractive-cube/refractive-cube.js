var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4dfGRr"
              }
            ],
            "inputs": [
              {
                "channel": 0,
                "type": "cubemap",
                "id": "4sfGzn",
                "filepath": "/media/a/793a105653fbdadabdc1325ca08675e1ce48ae5f12e37973829c87bea4be3232.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "clamp",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// \"RayMarching starting point\" \n// by Martijn Steinrucken aka The Art of Code/BigWings - 2020\n// The MIT License\n// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\n// Email: countfrolic@gmail.com\n// Twitter: @The_ArtOfCode\n// YouTube: youtube.com/TheArtOfCodeIsCool\n// Facebook: https://www.facebook.com/groups/theartofcode/\n//\n\n#define MAX_STEPS 200\n#define MAX_DIST 30.\n#define SURF_DIST .001\n\n#define S smoothstep\n#define T iTime\n\n\nmat2 Rot(float a) {\n    float s=sin(a), c=cos(a);\n    return mat2(c, -s, s, c);\n}\n\nstruct Hit{\n    float d;\n    float obj;\n    vec3 id;\n};\n\n\n\nfloat sdRoundBox( vec3 p, vec3 b, float r )\n{\n  vec3 q = abs(p) - b;\n  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;\n}\n\nfloat sdBox(vec3 p, vec3 s) {\n    p = abs(p)-s;\n\treturn length(max(p, 0.))+min(max(p.x, max(p.y, p.z)), 0.);\n}\n\n\nfloat opSmoothUnion( float d1, float d2, float k ) {\n    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );\n    return mix( d2, d1, h ) - k*h*(1.0-h); }\n\n\nHit GetDist(vec3 p) {\n\n    vec3 boxpos=p;\n\n    \n    boxpos.xz*=Rot(T*.7);\n   boxpos.xy*=Rot(-T*.5);\n   boxpos.yz*=Rot(-T*.8);\n    \n    float d = sdRoundBox(boxpos, vec3(.9),.2);\n   \n   float obj=-0.;\n //  boxpos.xy*=Rot(-T);\n //  boxpos.yz*=Rot(T);\n\n    \n   float rep=mix(.5,1.8,.5+.5*(sin(T*.4)));\n   boxpos+=rep/2.;\n   vec3 q=mod((boxpos),rep)-rep/2.;\n   vec3 ids=floor(boxpos-q);\n   float s2 = length(q)-(.08+(.05*sin(T+(ids.x+ids.y)+ids.z)))*(rep*2.);\n   float s2bis = sdBox(q,vec3((.05+(.05*sin(T+(ids.x+ids.y)+ids.z)))*(rep*2.)));\n   s2=mix(s2,s2bis,.5+.5*sin(T*2.+(ids.x+ids.y)+ids.z));\n   s2=max(d+.01,s2);\n   \n   d=max(d,-s2+.08);//*(rep+.5));    \n    \n    if(s2<d)\n        obj=1.;\n    \n    \n    d=min(s2,d);\n    \n        \n    vec3 q2=mod(p,2.)-1.;\n    vec3 id=floor(p-q2);\n    q2.y=p.y+sin(T+id.x*id.y)*.5+1.35;\n    float ds=length(q2)-.4;    \n    \n    ds=max(ds,-sdBox(p,vec3(2.5)));\n    ds=max(ds,length(p)-6.);\n    if(ds<d){\n        obj=3.;\n    }\n    d=min(d,ds);\n    \n    float pl=p.y+1.5;\n    if(pl<d)\n        obj=3.;\n    \n    d=opSmoothUnion(d,pl,.4);    \n    \n      \n\n    return Hit(d,obj,ids);\n}\n\nHit RayMarch(vec3 ro, vec3 rd,float direction) {\n\tfloat dO=0.;\n    float obj=0.;\n    vec3 id;\n    for(int i=0; i<MAX_STEPS; i++) {\n    \tvec3 p = ro + rd*dO;\n        Hit h=GetDist(p);\n        obj=h.obj;\n        id=h.id;\n        float dS = h.d*direction;\n        dO += dS;\n        if(dO>MAX_DIST || abs(dS)<SURF_DIST) break;\n    }\n    \n    return Hit(dO,obj,id);\n}\n\nvec3 GetNormal(vec3 p) {\n\tfloat d = GetDist(p).d;\n    vec2 e = vec2(.001, 0);\n    \n    vec3 n = d - vec3(\n        GetDist(p-e.xyy).d,\n        GetDist(p-e.yxy).d,\n        GetDist(p-e.yyx).d);\n    \n    return normalize(n);\n}\n\nvec3 GetRayDir(vec2 uv, vec3 p, vec3 l, float z) {\n    vec3 f = normalize(l-p),\n        r = normalize(cross(vec3(0,1,0), f)),\n        u = cross(f,r),\n        c = f*z,\n        i = c + uv.x*r + uv.y*u,\n        d = normalize(i);\n    return d;\n}\n\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord)\n{\n    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;\n\tvec2 m = iMouse.xy/iResolution.xy;\n\n    vec3 ro = vec3(0, 1.5, -5);\n    if(dot(m.xy,m.xy)>0.){\n        ro.yz *= Rot(-min(m.y,.45)*3.14+1.);\n        ro.xz *= Rot(-m.x*6.2831);\n       }\n       \n   ro.xz*=Rot(T/2.);    \n       \n    vec3 rd = GetRayDir(uv, ro, vec3(0,0.,0), 1.);\n    vec3 col = vec3(0);\n   \n    float bo=6.;\n    float fresnel=1.;\n\n    bool issecond=false;\n    Hit h;\n    float i=0.;\n    vec3 p;\n    for(;i<bo;i++){\n    \n        h=RayMarch(ro, rd,1.);\n        float IOR=1.35;\n        //col*=1./bo;\n        \n\n        if(h.d<MAX_DIST){\n            \n            if(h.obj==0.){\n                p = ro + rd * h.d;\n                vec3 n = GetNormal(p);\n                \n               \n                vec3 rIn=refract(rd,n,1./IOR);\n\n                Hit hIn= RayMarch(p-n*.003,rIn,-1.);\n                \n                float dIn=hIn.d;\n                vec3 pIn=p+rIn*dIn;\n                vec3 nIn=-GetNormal(pIn);\n\n                vec3 rOut=vec3(0.);\n                float shift=.01;\n\n                rOut=refract(rIn,nIn,IOR);\n                if(dot(rOut,rOut)==0.) rOut=reflect(-rIn,nIn);\n                ro=pIn-nIn*.03;\n                rd=rOut;\n                \n            }\n            else if(h.obj==1.){\n                vec3 p = ro + rd * h.d;\n                vec3 n = GetNormal(p);\n                float dif = dot(n, normalize(vec3(1,2,3)))*.5+.5;\n                col+=((.5+.5*sin((vec3(.54,.3,.7)+h.id)*T))*fresnel)*.7;\n                col *= vec3(dif);\n                //*1./bo;\n                break;\n            }\n            else if(h.obj==2.){\n                break;\n                vec3 p = ro + rd * h.d;\n                vec3 n = GetNormal(p);\n                float dif = dot(n, normalize(vec3(1,2,3)))*.5+.5;\n                col+=vec3(.2,.1,.8);\n\n                col *= vec3(dif);\n                break;\n            }\n            else if(h.obj==3.){\n                p = ro + rd * h.d;\n                vec3 n = GetNormal(p);\n                \n                ro=p+n*.003;\n                rd=reflect(rd,n);\n                if(!issecond){\n                    fresnel=pow(1.-dot(rd,n),2.);\n                //col+=vec3(.03,.08,.1);\n                   }\n                issecond=true;\n            }\n            \n        }\n        else{\n            vec3 bcolor=vec3(.08);\n            if(i==0. ){\n                col=bcolor;\n\n                }\n            else\n                col=mix((col+texture(iChannel0,rd.xyz).xyz)/i*fresnel,bcolor,1.-S(15.,0.,length(p)));\n            break;\n        }\n    }\n    \n    \n \n    col = pow(col, vec3(.4545));\t// gamma correction\n    \n    fragColor = vec4(col,1.0);\n}\n\n",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "flcSW2",
          "date": "1639759279",
          "viewed": 5167,
          "name": "simple refraction test",
          "username": "drschizzo",
          "description": ".",
          "likes": 121,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "raymarching",
            "reflect",
            "refract"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);