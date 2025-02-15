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
            "code": "// Protean clouds by nimitz (twitter: @stormoid)\n// https://www.shadertoy.com/view/3l23Rh\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n/*\n\tTechnical details:\n\n\tThe main volume noise is generated from a deformed periodic grid, which can produce\n\ta large range of noise-like patterns at very cheap evalutation cost. Allowing for multiple\n\tfetches of volume gradient computation for improved lighting.\n\n\tTo further accelerate marching, since the volume is smooth, more than half the the density\n\tinformation isn't used to rendering or shading but only as an underlying volume\tdistance to \n\tdetermine dynamic step size, by carefully selecting an equation\t(polynomial for speed) to \n\tstep as a function of overall density (not necessarily rendered) the visual results can be \n\tthe\tsame as a naive implementation with ~40% increase in rendering performance.\n\n\tSince the dynamic marching step size is even less uniform due to steps not being rendered at all\n\tthe fog is evaluated as the difference of the fog integral at each rendered step.\n\n*/\n\nmat2 rot(in float a){float c = cos(a), s = sin(a);return mat2(c,s,-s,c);}\nconst mat3 m3 = mat3(0.33338, 0.56034, -0.71817, -0.87887, 0.32651, -0.15323, 0.15162, 0.69596, 0.61339)*1.93;\nfloat mag2(vec2 p){return dot(p,p);}\nfloat linstep(in float mn, in float mx, in float x){ return clamp((x - mn)/(mx - mn), 0., 1.); }\nfloat prm1 = 0.;\nvec2 bsMo = vec2(0);\n\nvec2 disp(float t){ return vec2(sin(t*0.22)*1., cos(t*0.175)*1.)*2.; }\n\nvec2 map(vec3 p)\n{\n    vec3 p2 = p;\n    p2.xy -= disp(p.z).xy;\n    p.xy *= rot(sin(p.z+iTime)*(0.1 + prm1*0.05) + iTime*0.09);\n    float cl = mag2(p2.xy);\n    float d = 0.;\n    p *= .61;\n    float z = 1.;\n    float trk = 1.;\n    float dspAmp = 0.1 + prm1*0.2;\n    for(int i = 0; i < 5; i++)\n    {\n\t\tp += sin(p.zxy*0.75*trk + iTime*trk*.8)*dspAmp;\n        d -= abs(dot(cos(p), sin(p.yzx))*z);\n        z *= 0.57;\n        trk *= 1.4;\n        p = p*m3;\n    }\n    d = abs(d + prm1*3.)+ prm1*.3 - 2.5 + bsMo.y;\n    return vec2(d + cl*.2 + 0.25, cl);\n}\n\nvec4 render( in vec3 ro, in vec3 rd, float time )\n{\n\tvec4 rez = vec4(0);\n    const float ldst = 8.;\n\tvec3 lpos = vec3(disp(time + ldst)*0.5, time + ldst);\n\tfloat t = 1.5;\n\tfloat fogT = 0.;\n\tfor(int i=0; i<130; i++)\n\t{\n\t\tif(rez.a > 0.99)break;\n\n\t\tvec3 pos = ro + t*rd;\n        vec2 mpv = map(pos);\n\t\tfloat den = clamp(mpv.x-0.3,0.,1.)*1.12;\n\t\tfloat dn = clamp((mpv.x + 2.),0.,3.);\n        \n\t\tvec4 col = vec4(0);\n        if (mpv.x > 0.6)\n        {\n        \n            col = vec4(sin(vec3(5.,0.4,0.2) + mpv.y*0.1 +sin(pos.z*0.4)*0.5 + 1.8)*0.5 + 0.5,0.08);\n            col *= den*den*den;\n\t\t\tcol.rgb *= linstep(4.,-2.5, mpv.x)*2.3;\n            float dif =  clamp((den - map(pos+.8).x)/9., 0.001, 1. );\n            dif += clamp((den - map(pos+.35).x)/2.5, 0.001, 1. );\n            col.xyz *= den*(vec3(0.005,.045,.075) + 1.5*vec3(0.033,0.07,0.03)*dif);\n        }\n\t\t\n\t\tfloat fogC = exp(t*0.2 - 2.2);\n\t\tcol.rgba += vec4(0.06,0.11,0.11, 0.1)*clamp(fogC-fogT, 0., 1.);\n\t\tfogT = fogC;\n\t\trez = rez + col*(1. - rez.a);\n\t\tt += clamp(0.5 - dn*dn*.05, 0.09, 0.3);\n\t}\n\treturn clamp(rez, 0.0, 1.0);\n}\n\nfloat getsat(vec3 c)\n{\n    float mi = min(min(c.x, c.y), c.z);\n    float ma = max(max(c.x, c.y), c.z);\n    return (ma - mi)/(ma+ 1e-7);\n}\n\n//from my \"Will it blend\" shader (https://www.shadertoy.com/view/lsdGzN)\nvec3 iLerp(in vec3 a, in vec3 b, in float x)\n{\n    vec3 ic = mix(a, b, x) + vec3(1e-6,0.,0.);\n    float sd = abs(getsat(ic) - mix(getsat(a), getsat(b), x));\n    vec3 dir = normalize(vec3(2.*ic.x - ic.y - ic.z, 2.*ic.y - ic.x - ic.z, 2.*ic.z - ic.y - ic.x));\n    float lgt = dot(vec3(1.0), ic);\n    float ff = dot(dir, normalize(ic));\n    ic += 1.5*dir*sd*ff*lgt;\n    return clamp(ic,0.,1.);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\t\n\tvec2 q = fragCoord.xy/iResolution.xy;\n    vec2 p = (gl_FragCoord.xy - 0.5*iResolution.xy)/iResolution.y;\n    bsMo = (iMouse.xy - 0.5*iResolution.xy)/iResolution.y;\n    \n    float time = iTime*3.;\n    vec3 ro = vec3(0,0,time);\n    \n    ro += vec3(sin(iTime)*0.5,sin(iTime*1.)*0.,0);\n        \n    float dspAmp = .85;\n    ro.xy += disp(ro.z)*dspAmp;\n    float tgtDst = 3.5;\n    \n    vec3 target = normalize(ro - vec3(disp(time + tgtDst)*dspAmp, time + tgtDst));\n    ro.x -= bsMo.x*2.;\n    vec3 rightdir = normalize(cross(target, vec3(0,1,0)));\n    vec3 updir = normalize(cross(rightdir, target));\n    rightdir = normalize(cross(updir, target));\n\tvec3 rd=normalize((p.x*rightdir + p.y*updir)*1. - target);\n    rd.xy *= rot(-disp(time + 3.5).x*0.2 + bsMo.x);\n    prm1 = smoothstep(-0.4, 0.4,sin(iTime*0.3));\n\tvec4 scn = render(ro, rd, time);\n\t\t\n    vec3 col = scn.rgb;\n    col = iLerp(col.bgr, col.rgb, clamp(1.-prm1,0.05,1.));\n    \n    col = pow(col, vec3(.55,0.65,0.6))*vec3(1.,.97,.9);\n\n    col *= pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.12)*0.7+0.3; //Vign\n    \n\tfragColor = vec4( col, 1.0 );\n}",
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
          "id": "3l23Rh",
          "date": "1558990029",
          "viewed": 117483,
          "name": "Protean clouds",
          "username": "nimitz",
          "description": "Fully procedural 3D animated volume with three evaluations per step (for shading) running fast enough for 1080p rendering.\n\nFeaturing simple mouse interaction.",
          "likes": 1784,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "procedural",
            "3d",
            "fast",
            "volumetric"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);