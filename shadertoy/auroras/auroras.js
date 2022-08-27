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
            "code": "// Auroras by nimitz 2017 (twitter: @stormoid)\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n/*\n\t\n\tThere are two main hurdles I encountered rendering this effect. \n\tFirst, the nature of the texture that needs to be generated to get a believable effect\n\tneeds to be very specific, with large scale band-like structures, small scale non-smooth variations\n\tto create the trail-like effect, a method for animating said texture smoothly and finally doing all\n\tof this cheaply enough to be able to evaluate it several times per fragment/pixel.\n\n\tThe second obstacle is the need to render a large volume while keeping the computational cost low.\n\tSince the effect requires the trails to extend way up in the atmosphere to look good, this means\n\tthat the evaluated volume cannot be as constrained as with cloud effects. My solution was to make\n\tthe sample stride increase polynomially, which works very well as long as the trails are lower opcaity than\n\tthe rest of the effect. Which is always the case for auroras.\n\n\tAfter that, there were some issues with getting the correct emission curves and removing banding at lowered\n\tsample densities, this was fixed by a combination of sample number influenced dithering and slight sample blending.\n\n\tN.B. the base setup is from an old shader and ideally the effect would take an arbitrary ray origin and\n\tdirection. But this was not required for this demo and would be trivial to fix.\n*/\n\n#define time iTime\n\nmat2 mm2(in float a){float c = cos(a), s = sin(a);return mat2(c,s,-s,c);}\nmat2 m2 = mat2(0.95534, 0.29552, -0.29552, 0.95534);\nfloat tri(in float x){return clamp(abs(fract(x)-.5),0.01,0.49);}\nvec2 tri2(in vec2 p){return vec2(tri(p.x)+tri(p.y),tri(p.y+tri(p.x)));}\n\nfloat triNoise2d(in vec2 p, float spd)\n{\n    float z=1.8;\n    float z2=2.5;\n\tfloat rz = 0.;\n    p *= mm2(p.x*0.06);\n    vec2 bp = p;\n\tfor (float i=0.; i<5.; i++ )\n\t{\n        vec2 dg = tri2(bp*1.85)*.75;\n        dg *= mm2(time*spd);\n        p -= dg/z2;\n\n        bp *= 1.3;\n        z2 *= .45;\n        z *= .42;\n\t\tp *= 1.21 + (rz-1.0)*.02;\n        \n        rz += tri(p.x+tri(p.y))*z;\n        p*= -m2;\n\t}\n    return clamp(1./pow(rz*29., 1.3),0.,.55);\n}\n\nfloat hash21(in vec2 n){ return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }\nvec4 aurora(vec3 ro, vec3 rd)\n{\n    vec4 col = vec4(0);\n    vec4 avgCol = vec4(0);\n    \n    for(float i=0.;i<50.;i++)\n    {\n        float of = 0.006*hash21(gl_FragCoord.xy)*smoothstep(0.,15., i);\n        float pt = ((.8+pow(i,1.4)*.002)-ro.y)/(rd.y*2.+0.4);\n        pt -= of;\n    \tvec3 bpos = ro + pt*rd;\n        vec2 p = bpos.zx;\n        float rzt = triNoise2d(p, 0.06);\n        vec4 col2 = vec4(0,0,0, rzt);\n        col2.rgb = (sin(1.-vec3(2.15,-.5, 1.2)+i*0.043)*0.5+0.5)*rzt;\n        avgCol =  mix(avgCol, col2, .5);\n        col += avgCol*exp2(-i*0.065 - 2.5)*smoothstep(0.,5., i);\n        \n    }\n    \n    col *= (clamp(rd.y*15.+.4,0.,1.));\n    \n    \n    //return clamp(pow(col,vec4(1.3))*1.5,0.,1.);\n    //return clamp(pow(col,vec4(1.7))*2.,0.,1.);\n    //return clamp(pow(col,vec4(1.5))*2.5,0.,1.);\n    //return clamp(pow(col,vec4(1.8))*1.5,0.,1.);\n    \n    //return smoothstep(0.,1.1,pow(col,vec4(1.))*1.5);\n    return col*1.8;\n    //return pow(col,vec4(1.))*2.\n}\n\n\n//-------------------Background and Stars--------------------\n\nvec3 nmzHash33(vec3 q)\n{\n    uvec3 p = uvec3(ivec3(q));\n    p = p*uvec3(374761393U, 1103515245U, 668265263U) + p.zxy + p.yzx;\n    p = p.yzx*(p.zxy^(p >> 3U));\n    return vec3(p^(p >> 16U))*(1.0/vec3(0xffffffffU));\n}\n\nvec3 stars(in vec3 p)\n{\n    vec3 c = vec3(0.);\n    float res = iResolution.x*1.;\n    \n\tfor (float i=0.;i<4.;i++)\n    {\n        vec3 q = fract(p*(.15*res))-0.5;\n        vec3 id = floor(p*(.15*res));\n        vec2 rn = nmzHash33(id).xy;\n        float c2 = 1.-smoothstep(0.,.6,length(q));\n        c2 *= step(rn.x,.0005+i*i*0.001);\n        c += c2*(mix(vec3(1.0,0.49,0.1),vec3(0.75,0.9,1.),rn.y)*0.1+0.9);\n        p *= 1.3;\n    }\n    return c*c*.8;\n}\n\nvec3 bg(in vec3 rd)\n{\n    float sd = dot(normalize(vec3(-0.5, -0.6, 0.9)), rd)*0.5+0.5;\n    sd = pow(sd, 5.);\n    vec3 col = mix(vec3(0.05,0.1,0.2), vec3(0.1,0.05,0.2), sd);\n    return col*.63;\n}\n//-----------------------------------------------------------\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 q = fragCoord.xy / iResolution.xy;\n    vec2 p = q - 0.5;\n\tp.x*=iResolution.x/iResolution.y;\n    \n    vec3 ro = vec3(0,0,-6.7);\n    vec3 rd = normalize(vec3(p,1.3));\n    vec2 mo = iMouse.xy / iResolution.xy-.5;\n    mo = (mo==vec2(-.5))?mo=vec2(-0.1,0.1):mo;\n\tmo.x *= iResolution.x/iResolution.y;\n    rd.yz *= mm2(mo.y);\n    rd.xz *= mm2(mo.x + sin(time*0.05)*0.2);\n    \n    vec3 col = vec3(0.);\n    vec3 brd = rd;\n    float fade = smoothstep(0.,0.01,abs(brd.y))*0.1+0.9;\n    \n    col = bg(rd)*fade;\n    \n    if (rd.y > 0.){\n        vec4 aur = smoothstep(0.,1.5,aurora(ro,rd))*fade;\n        col += stars(rd);\n        col = col*(1.-aur.a) + aur.rgb;\n    }\n    else //Reflections\n    {\n        rd.y = abs(rd.y);\n        col = bg(rd)*fade*0.6;\n        vec4 aur = smoothstep(0.0,2.5,aurora(ro,rd));\n        col += stars(rd)*0.1;\n        col = col*(1.-aur.a) + aur.rgb;\n        vec3 pos = ro + ((0.5-ro.y)/rd.y)*rd;\n        float nz2 = triNoise2d(pos.xz*vec2(.5,.7), 0.);\n        col += mix(vec3(0.2,0.25,0.5)*0.08,vec3(0.3,0.3,0.5)*0.7, nz2*0.4);\n    }\n    \n\tfragColor = vec4(col, 1.);\n}\n",
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
          "id": "XtGGRt",
          "date": "1507050602",
          "viewed": 28009,
          "name": "Auroras",
          "username": "nimitz",
          "description": "Trying to get cheap and fully procedural northern lights effect. Looks better in full screen. Could still be improved...",
          "likes": 544,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "procedural",
            "aurora",
            "atmosphere",
            "weather"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);