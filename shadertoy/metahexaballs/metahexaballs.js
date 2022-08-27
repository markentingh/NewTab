var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [],
            "code": "/*by mu6k, Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n\n I have no idea how I ended up here, but it demosceneish enough to publish.\n You can use the mouse to rotate the camera around the 'object'.\n If you can't see the shadows, increase occlusion_quality.\n If it doesn't compile anymore decrease object_count and render_steps.\n\n 15/06/2013:\n - published\n \n 16/06/2013:\n - modified for better performance and compatibility\n\n muuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuusk!*/\n\n#define occlusion_enabled\n#define occlusion_quality 4\n//#define occlusion_preview\n\n#define noise_use_smoothstep\n\n#define light_color vec3(0.1,0.4,0.6)\n#define light_direction normalize(vec3(.2,1.0,-0.2))\n#define light_speed_modifier 1.0\n\n#define object_color vec3(0.9,0.1,0.1)\n#define object_count 9\n#define object_speed_modifier 1.0\n\n#define render_steps 33\n\nfloat hash(float x)\n{\n\treturn fract(sin(x*.0127863)*17143.321);\n}\n\nfloat hash(vec2 x)\n{\n\treturn fract(cos(dot(x.xy,vec2(2.31,53.21))*124.123)*412.0); \n}\n\nvec3 cc(vec3 color, float factor,float factor2) //a wierd color modifier\n{\n\tfloat w = color.x+color.y+color.z;\n\treturn mix(color,vec3(w)*factor,w*factor2);\n}\n\nfloat hashmix(float x0, float x1, float interp)\n{\n\tx0 = hash(x0);\n\tx1 = hash(x1);\n\t#ifdef noise_use_smoothstep\n\tinterp = smoothstep(0.0,1.0,interp);\n\t#endif\n\treturn mix(x0,x1,interp);\n}\n\nfloat noise(float p) // 1D noise\n{\n\tfloat pm = mod(p,1.0);\n\tfloat pd = p-pm;\n\treturn hashmix(pd,pd+1.0,pm);\n}\n\nvec3 rotate_y(vec3 v, float angle)\n{\n\tfloat ca = cos(angle); float sa = sin(angle);\n\treturn v*mat3(\n\t\t+ca, +.0, -sa,\n\t\t+.0,+1.0, +.0,\n\t\t+sa, +.0, +ca);\n}\n\nvec3 rotate_x(vec3 v, float angle)\n{\n\tfloat ca = cos(angle); float sa = sin(angle);\n\treturn v*mat3(\n\t\t+1.0, +.0, +.0,\n\t\t+.0, +ca, -sa,\n\t\t+.0, +sa, +ca);\n}\n\nfloat max3(float a, float b, float c)//returns the maximum of 3 values\n{\n\treturn max(a,max(b,c));\n}\n\nvec3 bpos[object_count];//position for each metaball\n\nfloat dist(vec3 p)//distance function\n{\n\tfloat d=1024.0;\n\tfloat nd;\n\tfor (int i=0 ;i<object_count; i++)\n\t{\n\t\tvec3 np = p+bpos[i];\n\t\tfloat shape0 = max3(abs(np.x),abs(np.y),abs(np.z))-1.0;\n\t\tfloat shape1 = length(np)-1.0;\n\t\tnd = shape0+(shape1-shape0)*2.0;\n\t\td = mix(d,nd,smoothstep(-1.0,+1.0,d-nd));\n\t}\n\treturn d;\n}\n\nvec3 normal(vec3 p,float e) //returns the normal, uses the distance function\n{\n\tfloat d=dist(p);\n\treturn normalize(vec3(dist(p+vec3(e,0,0))-d,dist(p+vec3(0,e,0))-d,dist(p+vec3(0,0,e))-d));\n}\n\nvec3 light = light_direction; //global variable that holds light direction\n\nvec3 background(vec3 d)//render background\n{\n\tfloat t=iTime*0.5*light_speed_modifier;\n\tfloat qq = dot(d,light)*.5+.5;\n\tfloat bgl = qq;\n\tfloat q = (bgl+noise(bgl*6.0+t)*.85+noise(bgl*12.0+t)*.85);\n\tq+= pow(qq,32.0)*2.0;\n\tvec3 sky = vec3(0.1,0.4,0.6)*q;\n\treturn sky;\n}\n\nfloat occlusion(vec3 p, vec3 d)//returns how much a point is visible from a given direction\n{\n\tfloat occ = 1.0;\n\tp=p+d;\n\tfor (int i=0; i<occlusion_quality; i++)\n\t{\n\t\tfloat dd = dist(p);\n\t\tp+=d*dd;\n\t\tocc = min(occ,dd);\n\t}\n\treturn max(.0,occ);\n}\n\nvec3 object_material(vec3 p, vec3 d)\n{\n\tvec3 color = normalize(object_color*light_color);\n\tvec3 n = normal(p,0.1);\n\tvec3 r = reflect(d,n);\t\n\t\n\tfloat reflectance = dot(d,r)*.5+.5;reflectance=pow(reflectance,2.0);\n\tfloat diffuse = dot(light,n)*.5+.5; diffuse = max(.0,diffuse);\n\t\n\t#ifdef occlusion_enabled\n\t\tfloat oa = occlusion(p,n)*.4+.6;\n\t\tfloat od = occlusion(p,light)*.95+.05;\n\t\tfloat os = occlusion(p,r)*.95+.05;\n\t#else\n\t\tfloat oa=1.0;\n\t\tfloat ob=1.0;\n\t\tfloat oc=1.0;\n\t#endif\n\t\n\t#ifndef occlusion_preview\n\t\tcolor = \n\t\tcolor*oa*.2 + //ambient\n\t\tcolor*diffuse*od*.7 + //diffuse\n\t\tbackground(r)*os*reflectance*.7; //reflection\n\t#else\n\t\tcolor=vec3((oa+od+os)*.3);\n\t#endif\n\t\n\treturn color;\n}\n\n#define offset1 4.7\n#define offset2 4.6\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 uv = fragCoord.xy / iResolution.xy - 0.5;\n\tuv.x *= iResolution.x/iResolution.y; //fix aspect ratio\n\tvec3 mouse = vec3(iMouse.xy/iResolution.xy - 0.5,iMouse.z-.5);\n\t\n\tfloat t = iTime*.5*object_speed_modifier + 2.0;\n\t\n\tfor (int i=0 ;i<object_count; i++) //position for each metaball\n\t{\n\t\tbpos[i] = 1.3*vec3(\n\t\t\tsin(t*0.967+float(i)*42.0),\n\t\t\tsin(t*.423+float(i)*152.0),\n\t\t\tsin(t*.76321+float(i)));\n\t}\n\t\n\t//setup the camera\n\tvec3 p = vec3(.0,0.0,-4.0);\n\tp = rotate_x(p,mouse.y*9.0+offset1);\n\tp = rotate_y(p,mouse.x*9.0+offset2);\n\tvec3 d = vec3(uv,1.0);\n\td.z -= length(d)*.5; //lens distort\n\td = normalize(d);\n\td = rotate_x(d,mouse.y*9.0+offset1);\n\td = rotate_y(d,mouse.x*9.0+offset2);\n\t\n\t//and action!\n\tfloat dd;\n\tvec3 color;\n\tfor (int i=0; i<render_steps; i++) //raymarch\n\t{\n\t\tdd = dist(p);\n\t\tp+=d*dd*.7;\n\t\tif (dd<.04 || dd>4.0) break;\n\t}\n\t\n\tif (dd<0.5) //close enough\n\t\tcolor = object_material(p,d);\n\telse\n\t\tcolor = background(d);\n\t\n\t//post procesing\n\tcolor *=.85;\n\tcolor = mix(color,color*color,0.3);\n\tcolor -= hash(color.xy+uv.xy)*.015;\n\tcolor -= length(uv)*.1;\n\tcolor =cc(color,.5,.6);\n\tfragColor = vec4(color,1.0);\n}",
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
          "id": "Mss3WN",
          "date": "1371251277",
          "viewed": 9033,
          "name": "MetaHexaBalls",
          "username": "mu6k",
          "description": "I have no idea how I ended up here, but it demosceneish enough to publish. You can use the mouse to rotate the camera around the 'object'.",
          "likes": 211,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "raymarching",
            "lighting",
            "occlusion"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);