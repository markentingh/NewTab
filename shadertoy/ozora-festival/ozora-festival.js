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
            "code": "#define R(p,a,r)mix(a*dot(p,a),p,cos(r))+sin(r)*cross(p,a)\n#define H(h)(cos((h)*6.3+vec3(0,23,21))*.5+.5)\nvoid mainImage(out vec4 O, vec2 C)\n{\n    O=vec4(0);\n    vec3 p,q,r=iResolution,\n    d=normalize(vec3((C*2.-r.xy)/r.y,1));  \n    for(float i=0.,a,s,e,g=0.;\n        ++i<110.;\n        O.xyz+=mix(vec3(1),H(g*.1),sin(.8))*1./e/8e3\n    )\n    {\n        p=g*d;\n        p.z+=iTime*6.5;\n        a=10.;\n        p=mod(p-a,a*2.)-a;\n        s=6.;\n        for(int i=0;i++<8;){\n            p=.3-abs(p);\n            \n            p.x<p.z?p=p.zyx:p;\n            p.z<p.y?p=p.xzy:p;\n            p.y<p.x?p=p.zyx:p;\n            \n            s*=e=1.4+sin(iTime*.234)*.1;\n            p=abs(p)*e-\n                vec3(\n                    5.+cos(iTime*.3+.5*cos(iTime*.3))*3.,\n                    120,\n                    8.+cos(iTime*.5)*5.\n                 );\n         }\n       //  g+=e=length(p.yz)/s;\n         g+=e=length(p.yx)/s;\n    }\n}",
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
          "id": "DtGyWh",
          "date": "1700137505",
          "viewed": 71,
          "name": "OZORA FESTIVAL - SHIPPO MASTER",
          "username": "POSTHELIOS",
          "description": "Certainly, let's go through this GLSL (OpenGL Shading Language) shader code.",
          "likes": 3,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "fractal"
          ],
          "hasliked": 0,
          "parentid": "dtVcDz",
          "parentname": "OZORA FESTIVAL -  SHIPPO Ext. 2"
        }
      }
];

compileAndStart(jsnShader);