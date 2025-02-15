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
            "code": "// Inspired by \"past racer\" by jetlab\n\n// Lower this if too slow\nfloat steps = 30.0;\n\nfloat time=0.0;\n\nmat2 rot(float a) {\n  float ca=cos(a);\n  float sa=sin(a);\n  return mat2(ca,sa,-sa,ca);  \n}\n\n// Camera rotation\nvoid cam(inout vec3 p, float t) {\n  t*=0.3;\n  p.xz *= rot(sin(t)*0.3);\n  p.xy *= rot(sin(t*0.7)*0.4);\n}\n\nfloat hash(float t) {\n  return fract(sin(t*788.874));\n}\n\nfloat curve(float t, float d) {\n  t/=d;\n  return mix(hash(floor(t)), hash(floor(t)+1.0), pow(smoothstep(0.0,1.0,fract(t)),10.0));\n}\n\nfloat tick(float t, float d) {\n  t/=d;\n  float m=fract(t);\n  m=smoothstep(0.0,1.0,m);\n  m=smoothstep(0.0,1.0,m);\n  return (floor(t)+m)*d;\n}\n\nfloat hash2(vec2 uv) {\n  return fract(dot(sin(uv*425.215+uv.yx*714.388),vec2(522.877)));\n}\n\nvec2 hash22(vec2 uv) {\n  return fract(sin(uv*425.215+uv.yx*714.388)*vec2(522.877));\n}\n\nvec3 hash3(vec2 id) {\n  return fract(sin(id.xyy*vec3(427.544,224.877,974.542)+id.yxx*vec3(947.544,547.847,652.454))*342.774);\n}\n\nfloat camtime(float t) {\n  \n  return t*1.9 + tick(t, 1.9)*1.0;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n  time=mod(iTime, 300.0);\n    \n  vec2 uv = vec2(fragCoord.x / iResolution.x, fragCoord.y / iResolution.y);\n  uv -= 0.5;\n  uv /= vec2(iResolution.y / iResolution.x, 1);\n\n  vec3 col=vec3(0);\n  \n  vec3 size = vec3(0.9,0.9,1000);\n  \n  float dof = 0.02;\n  float dofdist = 1.0/5.0;\n  \n    // Path tracing\n  for(float j=0.0; j<steps; ++j) {\n      \n    // DOF offset\n    vec2 off=hash22(uv+j*74.542+35.877)*2.0-1.0;\n      \n    // Motion blur offset\n    float t2=camtime(time + j*0.05/steps);\n    \n    vec3 s=vec3(0,0,-1);\n    s.xy += off*dof;\n    vec3 r=normalize(vec3(-uv-off*dof*dofdist, 2));\n    \n    cam(s,t2);\n    cam(r,t2);\n    \n    vec3 alpha=vec3(1);\n      \n    // Bounces\n    for(float i=0.0; i<3.0; ++i) {\n        \n      // box collision\n      vec3 boxmin = (size-s)/r;\n      vec3 boxmax = (-size-s)/r;\n      \n      vec3 box=max(boxmin,boxmax);\n        \n      // only check box x and y axis\n      float d = min(box.x,box.y);\n      vec3 p=s+r*d;\n      vec2 cuv = p.xz;\n      vec3 n=vec3(0,sign(box.y),0);\n        \n      if(box.x<box.y) {\n         \n        cuv=p.yz;\n        cuv.x+=1.0;\n        n=vec3(sign(box.x),0.0,0.0);\n\t\t\t\n      }\n     \n      vec3 p2 = p;\n      p2.z += t2*3.0;\n      cuv.y += t2*3.0;\n      cuv *= 3.0;\n      vec2 id = floor(cuv);\n      \n      float rough = min(1.0,0.85+0.2*hash2(id+100.5));\n      \n      vec3 addcol = vec3(0);\n      //addcol += max(vec3(0),vec3(0.0,sin(cuv.y*0.12 + time*1.7),0.4 + 0.4*sin(cuv.y*0.07 + time*2.3))*4.0*step(hash2(id),0.1));\n      //addcol += max(vec3(0),sin(cuv.y*vec3(0.12,0.07,0.02)*0.5 + 1.0*t2*vec3(1.7,2.3,3.7))) * step(hash2(id),0.1);\n      addcol += vec3(1.0+max(0.0,cos(cuv.y*0.025)*0.9),0.5,0.2+max(0.0,sin(cuv.y*0.05)*0.5))*2.0;\n      addcol *= smoothstep(0.5*curve(time+id.y*0.01+id.x*0.03, 0.3),0.0,hash2(id));\n      //addcol *= 0.5+curve(t2+cuv.y*0.3, 0.3);\n      //addcol *= step(0.5,sin(p2.x)*sin(p2.z*0.4+curve(t2, 0.1)*1.0));\n      addcol *= step(0.5,sin(p2.x)*sin(p2.z*0.4));\n      addcol += vec3(0.7,0.5,1.2)*step(p2.y,-0.9)*max(0.0,curve(time,0.2)*2.0-1.0)*step(hash2(id+.7),0.2);\n      col += addcol * alpha;\n      \n      float fre = pow(1.0-max(0.0,dot(n,r)),3.0);\n      alpha *= fre*0.9;\n      \n      vec3 pure=reflect(r,n);\n      \n      r=normalize(hash3(uv+j*74.524+i*35.712)-0.5);\n      float dr=dot(r,n);\n      if(dr<0.0) r=-r;\n      r=normalize(mix(r,pure,rough));\n      \n      s=p;\n    }\n\n  }\n  col /= steps;\n  \n  col *= 2.0;\n  \n  col=smoothstep(0.0,1.0,col);\n  col=pow(col, vec3(0.4545));\n  \n    \n  fragColor = vec4(col, 1);\n}",
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
          "id": "3sXyRN",
          "date": "1584218994",
          "viewed": 11544,
          "name": "Corridor Travel",
          "username": "NuSan",
          "description": "Inspired by \"past racer\" by jetlab",
          "likes": 263,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "pathtracing"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);