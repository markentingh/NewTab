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
            "code": "#define S(a,b,t) smoothstep(a,b,t)\n\nfloat DistLine(vec2 p, vec2 a, vec2 b) {\n    vec2 pa = p-a;\n    vec2 ba = b-a;\n    float t = clamp(dot(pa, ba)/dot(ba, ba), 0., 1.);\n    return length(pa-ba*t);\n}\n\nfloat N21(vec2 p) {\n    p = fract(p*vec2(233.34, 851.73));\n    p += dot(p, p+23.45);\n    return fract(p.x*p.y);\n}\n\nvec2 N22(vec2 p) {\n    float n = N21(p);\n    return vec2(n, N21(p+n));\n}\n\nvec2 GetPos (vec2 id, vec2 offs) {\n    vec2 n = N22(id+offs)* iTime;\n    \n    return offs+sin(n)*.4;\n}\n\nfloat Line(vec2 p, vec2 a, vec2 b) {\n    float d = DistLine(p,a,b); // distance to the line segment\n    float m = S(.03,.01,d); // cut out the line\n    float d2 = length(a-b);\n    m *= S(1.2, .8, d2)*.5+S(.05,.03, abs(d2-.75)); // make them not all visible\n    return m;\n}\n\nfloat Layer (vec2 uv) {\n    float m = 0.;\n    vec2 gv = fract(uv)-.5;\n    vec2 id = floor(uv);\n    \n    vec2 p[9];\n    int i = 0;\n    \n\n    \n    for (float y=-1.; y<=1.;y++) {\n        for (float x=-1.;x<=1.;x++) {\n            p[i++] = GetPos(id, vec2(x,y));\n        }\n    }\n    \n    float t = iTime*20.;\n    for(int i=0; i<9; i++) {\n        m += Line(gv, p[4], p[i]);\n        \n        vec2 j = (p[i]-gv)*15.;\n        float sparkle = 1./dot(j, j);\n        \n        m += sparkle*(sin(t+fract(p[i].x)*10.)*.5+.5);\n    }\n    m += Line(gv, p[1], p[3]);\n    m += Line(gv, p[1], p[5]);\n    m += Line(gv, p[5], p[7]);\n    m += Line(gv, p[7], p[3]);\n    \n    return m;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 uv = (fragCoord-.5*iResolution.xy)/iResolution.y;\n    vec2 mouse = (iMouse.xy/iResolution.xy)-.5;\n    float m = 0.;\n    float t = iTime*.1;\n    \n    float s = sin(t);\n    float c = cos(t);\n    mat2 rot = mat2(c,-s,s,c);\n    \n    uv *= rot;\n    mouse *= rot;\n    \n    for (float i=0.; i<1.;i+=1./4.){\n        float z = fract(i+t);\n        float size = mix(10.,.5,z);\n        float fade = S(0.,.5,z)*S(1.,.8,z);\n        m += Layer(uv*size+i*20.-mouse)*fade;\n    }\n    \n    \n    \n\n    vec3 col = vec3(m);\n    \n    //col.rg = id+1.;\n    \n    //if (gv.x>.48||gv.y>.48) col = vec3(1.,0,0);\n\n    fragColor = vec4(col,1.0);\n}",
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
          "id": "WdK3RD",
          "date": "1569836162",
          "viewed": 841,
          "name": "SparklePlexus",
          "username": "carmandale",
          "description": "random dots, connected and sparkling.",
          "likes": 24,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "sparkle",
            "plexus"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);