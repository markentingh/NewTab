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
                "type": "buffer",
                "id": "4dXGR8",
                "filepath": "/media/previz/buffer00.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// ***********************************************************\n// Alcatraz / Rhodium 4k Intro liquid carbon\n// by Jochen \"Virgill\" Feldkötter\n//\n// 4kb executable: http://www.pouet.net/prod.php?which=68239\n// Youtube: https://www.youtube.com/watch?v=YK7fbtQw3ZU\n// ***********************************************************\n\n#define time iTime\n#define res iResolution\n\nconst float GA =2.399; \nconst mat2 rot = mat2(cos(GA),sin(GA),-sin(GA),cos(GA));\n\n// \tsimplyfied version of Dave Hoskins blur\nvec3 dof(sampler2D tex,vec2 uv,float rad)\n{\n\tvec3 acc=vec3(0);\n    vec2 pixel=vec2(.002*res.y/res.x,.002),angle=vec2(0,rad);;\n    rad=1.;\n\tfor (int j=0;j<80;j++)\n    {  \n        rad += 1./rad;\n\t    angle*=rot;\n        vec4 col=texture(tex,uv+pixel*(rad-1.)*angle);\n\t\tacc+=col.xyz;\n\t}\n\treturn acc/80.;\n}\n\n//-------------------------------------------------------------------------------------------\nvoid mainImage(out vec4 fragColor,in vec2 fragCoord)\n{\n\tvec2 uv = gl_FragCoord.xy / res.xy;\n\tfragColor=vec4(dof(iChannel0,uv,texture(iChannel0,uv).w),1.);\n}",
            "name": "Image",
            "description": "",
            "type": "image"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4dXGR8"
              }
            ],
            "inputs": [],
            "code": "// ***********************************************************\n// Alcatraz / Rhodium 4k Intro liquid carbon\n// by Jochen \"Virgill\" Feldkötter\n//\n// 4kb executable: http://www.pouet.net/prod.php?which=68239\n// Youtube: https://www.youtube.com/watch?v=YK7fbtQw3ZU\n// ***********************************************************\n\n#define time iTime\n#define res iResolution\n\nfloat bounce;\n\n// signed box\nfloat sdBox(vec3 p,vec3 b)\n{\n  vec3 d=abs(p)-b;\n  return min(max(d.x,max(d.y,d.z)),0.)+length(max(d,0.));\n}\n\n// rotation\nvoid pR(inout vec2 p,float a) \n{\n\tp=cos(a)*p+sin(a)*vec2(p.y,-p.x);\n}\n\n// 3D noise function (IQ)\nfloat noise(vec3 p)\n{\n\tvec3 ip=floor(p);\n    p-=ip; \n    vec3 s=vec3(7,157,113);\n    vec4 h=vec4(0.,s.yz,s.y+s.z)+dot(ip,s);\n    p=p*p*(3.-2.*p); \n    h=mix(fract(sin(h)*43758.5),fract(sin(h+s.x)*43758.5),p.x);\n    h.xy=mix(h.xz,h.yw,p.y);\n    return mix(h.x,h.y,p.z); \n}\n\nfloat map(vec3 p)\n{\t\n\tp.z-=1.0;\n    p*=0.9;\n    pR(p.yz,bounce*1.+0.4*p.x);\n    return sdBox(p+vec3(0,sin(1.6*time),0),vec3(20.0, 0.05, 1.2))-.4*noise(8.*p+3.*bounce);\n}\n\n//\tnormal calculation\nvec3 calcNormal(vec3 pos)\n{\n    float eps=0.0001;\n\tfloat d=map(pos);\n\treturn normalize(vec3(map(pos+vec3(eps,0,0))-d,map(pos+vec3(0,eps,0))-d,map(pos+vec3(0,0,eps))-d));\n}\n\n\n// \tstandard sphere tracing inside and outside\nfloat castRayx(vec3 ro,vec3 rd) \n{\n    float function_sign=(map(ro)<0.)?-1.:1.;\n    float precis=.0001;\n    float h=precis*2.;\n    float t=0.;\n\tfor(int i=0;i<120;i++) \n\t{\n        if(abs(h)<precis||t>12.)break;\n\t\th=function_sign*map(ro+rd*t);\n        t+=h;\n\t}\n    return t;\n}\n\n// \trefraction\nfloat refr(vec3 pos,vec3 lig,vec3 dir,vec3 nor,float angle,out float t2, out vec3 nor2)\n{\n    float h=0.;\n    t2=2.;\n\tvec3 dir2=refract(dir,nor,angle);  \n \tfor(int i=0;i<50;i++) \n\t{\n\t\tif(abs(h)>3.) break;\n\t\th=map(pos+dir2*t2);\n\t\tt2-=h;\n\t}\n    nor2=calcNormal(pos+dir2*t2);\n    return(.5*clamp(dot(-lig,nor2),0.,1.)+pow(max(dot(reflect(dir2,nor2),lig),0.),8.));\n}\n\n//\tsoftshadow \nfloat softshadow(vec3 ro,vec3 rd) \n{\n    float sh=1.;\n    float t=.02;\n    float h=.0;\n    for(int i=0;i<22;i++)  \n\t{\n        if(t>20.)continue;\n        h=map(ro+rd*t);\n        sh=min(sh,4.*h/t);\n        t+=h;\n    }\n    return sh;\n}\n\n//\tmain function\nvoid mainImage(out vec4 fragColor,in vec2 fragCoord)\n{    \n    bounce=abs(fract(0.05*time)-.5)*20.; // triangle function\n    \n\tvec2 uv=gl_FragCoord.xy/res.xy; \n    vec2 p=uv*2.-1.;\n   \n// \tbouncy cam every 10 seconds\n    float wobble=(fract(.1*(time-1.))>=0.9)?fract(-time)*0.1*sin(30.*time):0.;\n    \n//  camera    \n    vec3 dir = normalize(vec3(2.*gl_FragCoord.xy -res.xy, res.y));\n    vec3 org = vec3(0,2.*wobble,-3.);  \n    \n\n// \tstandard sphere tracing:\n    vec3 color = vec3(0.);\n    vec3 color2 =vec3(0.);\n    float t=castRayx(org,dir);\n\tvec3 pos=org+dir*t;\n\tvec3 nor=calcNormal(pos);\n\n// \tlighting:\n    vec3 lig=normalize(vec3(.2,6.,.5));\n//\tscene depth    \n    float depth=clamp((1.-0.09*t),0.,1.);\n    \n    vec3 pos2 = vec3(0.);\n    vec3 nor2 = vec3(0.);\n    if(t<12.0)\n    {\n    \tcolor2 = vec3(max(dot(lig,nor),0.)  +  pow(max(dot(reflect(dir,nor),lig),0.),16.));\n    \tcolor2 *=clamp(softshadow(pos,lig),0.,1.);  // shadow            \t\n       \tfloat t2;\n\t\tcolor2.rgb +=refr(pos,lig,dir,nor,0.9, t2, nor2)*depth;\n        color2-=clamp(.1*t2,0.,1.);\t\t\t\t// inner intensity loss\n\n\t}      \n  \n\n    float tmp = 0.;\n    float T = 1.;\n\n//\tanimation of glow intensity    \n    float intensity = 0.1*-sin(.209*time+1.)+0.05; \n\tfor(int i=0; i<128; i++)\n\t{\n        float density = 0.; float nebula = noise(org+bounce);\n        density=intensity-map(org+.5*nor2)*nebula;\n\t\tif(density>0.)\n\t\t{\n\t\t\ttmp = density / 128.;\n            T *= 1. -tmp * 100.;\n\t\t\tif( T <= 0.) break;\n\t\t}\n\t\torg += dir*0.078;\n    }    \n\tvec3 basecol=vec3(1./1. ,  1./4. , 1./16.);\n    T=clamp(T,0.,1.5); \n    color += basecol* exp(4.*(0.5-T) - 0.8);\n    color2*=depth;\n    color2+= (1.-depth)*noise(6.*dir+0.3*time)*.1;\t// subtle mist\n\n    \n//\tscene depth included in alpha channel\n    fragColor = vec4(vec3(1.*color+0.8*color2)*1.3,abs(0.67-depth)*2.+4.*wobble);\n}\n\n\n\n",
            "name": "Buffer A",
            "description": "",
            "type": "buffer"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": true,
          "mFlagMusicStream": true
        },
        "info": {
          "id": "llK3Dy",
          "date": "1476610551",
          "viewed": 66479,
          "name": "Rhodium liquid carbon",
          "username": "Virgill",
          "description": "Liquid carbon effect from Rhodium 4k Intro\n4kb executable: http://www.pouet.net/prod.php?which=68239\nhttps://www.youtube.com/watch?v=YK7fbtQw3ZU",
          "likes": 828,
          "published": 3,
          "flags": 96,
          "usePreview": 0,
          "tags": [
            "noise",
            "fire",
            "demoscene",
            "volumetric",
            "spheretracing",
            "twister",
            "liquid"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);