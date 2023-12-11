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
            "inputs": [],
            "code": "/*\nAuthor: Felipe Tovar-Henao [www.felipe-tovar-henao.com]\nTitle: Petroleum\n*/\n\n\n#define PI 3.14159265359\n#define TWO_PI 6.28318530718\n#define SCOPE_SIZE 2.\n\nvec2 viewport(in vec2 uv,in vec2 r){\n\treturn(uv*2.-r)/min(r.x,r.y);\n}\n\nfloat rand(in float x,in int s){\n    return fract(sin(x+float(s))*43758.5453123);\n}\n\nfloat rand(in float x){\n    return rand(x,0);\n}\n\nfloat rand(in vec2 uv,in int seed){\n    return fract(sin(dot(uv.xy,vec2(12.9898,78.233))+float(seed))*43758.5453123);\n}\n\nfloat rand(in vec2 uv){\n    return rand(uv,0);\n}\n\nfloat noise(in float x,in int s){\n    float xi=floor(x);\n    float xf=fract(x);\n    return mix(rand(xi,s),rand(xi+1.,s),smoothstep(0.,1.,xf));\n}\n\nfloat noise(in float x){\n    return noise(x,0);\n}\n\nfloat noise(in vec2 p,in int s){\n    vec2 pi=floor(p);\n    vec2 pf=fract(p);\n    \n    vec2 o=vec2(0,1);\n    \n    float bl=rand(pi,s);\n    float br=rand(pi+o.yx,s);\n    float tl=rand(pi+o.xy,s);\n    float tr=rand(pi+o.yy,s);\n    \n    vec2 w=smoothstep(0.,1.,pf);\n    \n    float t=mix(tl,tr,w.x);\n    float b=mix(bl,br,w.x);\n    \n    return mix(b,t,w.y);\n}\n\nfloat noise(in vec2 p){\n    return noise(p,0);\n}\n\nfloat cosine(in float x,in float s){\n    float y=cos(fract(x)*PI);\n    return floor(x)+.5-(.5*pow(abs(y),1./s)*sign(y));\n}\n\nvec3 gradient(in float t,in vec3 a,in vec3 b,in vec3 c,in vec3 d){\n\treturn a+b*cos(TWO_PI*(c*t+d));\n}\n\nvec3 c1=vec3(1.);\nvec3 c2=vec3(.1);\nvec3 c3=vec3(1.);\nvec3 c4=vec3(.5,.6,.7);\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord){\n\tvec2 uv=viewport(fragCoord.xy,iResolution.xy);\n\tfloat t=iTime/16.;\n\tt+=noise(t);\n\tt+=cosine(t,2.);\n\tuv*=2.5;\n\tvec2 uvf=fract(uv)-.5;\n\tvec2 uvi=floor(uv);\n\tvec2 n2=(vec2(noise(uv+t,0),noise(uv-t,1))-.5)*SCOPE_SIZE;\n\tuvi+=n2;\n\t\n\tvec3 col=vec3(0);\n\t\n\tfor(float i=-SCOPE_SIZE;i<=SCOPE_SIZE;i++){\n\t\tfor(float j=-SCOPE_SIZE;j<=SCOPE_SIZE;j++){\n\t\t\tvec2 off=vec2(i,j);\n\t\t\tfloat n=noise(uvi-off+t*2.)*4.;\n\t\t\tfloat s=exp2(n);\n\t\t\tfloat d=length(uvf+off+n2);\n\t\t\td=.025/d/s;\n\t\t\tcol=max(col,gradient(d+uvi.x+uvi.y,c1,c2,c3,c4)*sqrt(d));\n\t\t}\n\t}\n\tfragColor=vec4(col,1.);\n}",
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
          "id": "cl3cRS",
          "date": "1699325013",
          "viewed": 209,
          "name": "Petroleum",
          "username": "felipetovarhenao",
          "description": "Petroleum",
          "likes": 15,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "noise",
            "fluids"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);