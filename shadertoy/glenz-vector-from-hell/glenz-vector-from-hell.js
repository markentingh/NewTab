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
            "code": "const float PI=3.14159265358979323846;\n\n#define speed iTime\nfloat ground_x=0.0;//+0.125*sin(PI*speed*0.25);\nfloat ground_y=0.0;//+0.125*cos(PI*speed*0.25);\n#define ground_z (4.0*sin(PI*speed*0.0625))\n//+speed*0.5)\n\nfloat rand(in vec2 p,in float t,in float v)\n\t{\n\treturn fract(sin(dot(p+mod(t,1.0),vec2(12.9898,78.2333)))*v);\n\t}\n\nvec2 rotate(vec2 k,float t)\n\t{\n\treturn vec2(cos(t)*k.x-sin(t)*k.y,sin(t)*k.x+cos(t)*k.y);\n\t}\n\nfloat scene(vec3 p)\n\t{\n\tfloat bar_p=1.0;\n\tfloat bar_w=bar_p*(0.125+0.03125*float(1.0+2.0*sin(PI*p.z*2.0-PI*0.5)));\n\tfloat bar_x=length(max(abs(mod(p.yz,bar_p)-bar_p*0.5)-bar_w,0.0));\n\tfloat bar_y=length(max(abs(mod(p.xz,bar_p)-bar_p*0.5)-bar_w,0.0));\n\tfloat bar_z=length(max(abs(mod(p.xy,bar_p)-bar_p*0.5)-bar_w,0.0));\n\tfloat tube_p=0.125;\n\tfloat tube_w=tube_p*0.375;\n\tfloat tube_x=length(mod(p.yz,tube_p)-tube_p*0.5)-tube_w;\n\tfloat tube_y=length(mod(p.xz,tube_p)-tube_p*0.5)-tube_w;\n\tfloat tube_z=length(mod(p.xy,tube_p)-tube_p*0.5)-tube_w;\n\treturn -min(min(max(max(-bar_x,-bar_y),-bar_z),tube_y),tube_z);\n\t}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n\t{\n\tvec2 position=(fragCoord.xy/iResolution.xy);\n\tvec2 p=-1.0+2.0*position;\n\tvec3 dir=normalize(vec3(p*vec2(1.0/iResolution.y*iResolution.x,1.0),1.0));\t// screen ratio (x,y) fov (z)\n\tdir.yz=rotate(dir.yz,PI*0.5*sin(speed*0.25));\t// rotation x\n\t//dir.zx=rotate(dir.zx,speed*0.5);\t\t\t\t// rotation y\n\tdir.xy=rotate(dir.xy,PI*1.0*cos(speed*0.25));\t// rotation z\n\tvec3 ray=vec3(ground_x,ground_y,ground_z);\n\tfloat t=0.0;\n\tconst int ray_n=64;\n\tfor(int i=0;i<ray_n;i++)\n\t\t{\n\t\tfloat k=scene(ray+dir*t);\n        if(abs(k)<0.001) break;\n\t\tt+=k*0.5;\n\t\t}\n\tvec3 hit=ray+dir*t;\n\tvec2 h=vec2(0.005,-0.005);\n\tvec3 n=normalize(vec3(scene(hit+h.xyy),scene(hit+h.yxx),scene(hit+h.yyx)));\n\tfloat c=(n.x*2.0+n.y+n.z)*0.25-t*0.025;\n\tvec3 color=vec3(c*t*0.625-p.x*0.125,c*t*0.25+t*0.03125,c*0.375+t*0.0625+p.y*0.125);\n\tcolor=smoothstep(0.4,0.7,c)+color*color;\n\t/* post process */\n\tcolor*=0.6+0.4*rand(p,iTime,43758.5453);\n\tcolor=vec3(color.x*0.9-0.1*cos(p.x*iResolution.x),color.y*0.95+0.05*sin(p.y*iResolution.x/2.0),color.z*0.9+0.1*cos(PI/2.0+p.x*iResolution.x));\n\t/* return color */\n\tfragColor=vec4(color,1.0);\n\t}\n",
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
          "id": "MsXGR2",
          "date": "1374280699",
          "viewed": 5098,
          "name": "Dubstep my ass!",
          "username": "rez",
          "description": "A little effect I did for my latest demo entitled \"Glenz vector form Hell\" (http://pouet.net/prod.php?which=61209).\nI tried to implement a (very) simple version of my CRT emulation, I'm currently no very satisfied with the result here :3",
          "likes": 67,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "raymarching"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);