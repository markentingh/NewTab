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
                "type": "texture",
                "id": "Xsf3zn",
                "filepath": "/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Frozen wasteland\n// By Dave Hoskins\n// https://www.shadertoy.com/view/Xls3D2\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.\n\n\n#define ITR 90\n#define FAR 110.\n#define time iTime\n#define MOD3 vec3(.16532,.17369,.15787)\n#define SUN_COLOUR  vec3(1., .95, .85)\n\n#define TRIANGLE_NOISE\t    // .. This\n//#define TEXTURE_NOISE\t\t// .. Or this (faster, but not as sharp edged)\n//#define VALUE_NOISE \t\t// .. or more normal noise.\n//#define FOUR_D_NOISE\t    // ...Or movement\n\n\nfloat height(in vec2 p)\n{\n    float h = sin(p.x*.1+p.y*.2)+sin(p.y*.1-p.x*.2)*.5;\n    h += sin(p.x*.04+p.y*.01+3.0)*4.;\n    h -= sin(h*10.0)*.1;\n    return h;\n}\n\nfloat camHeight(in vec2 p)\n{\n    float h = sin(p.x*.1+p.y*.2)+sin(p.y*.1-p.x*.2)*.5;\n    h += sin(p.x*.04+p.y*.01+3.0)*4.;\n    return h;\n}\n\nfloat smin( float a, float b)\n{\n\tconst float k = 2.7;\n\tfloat h = clamp( 0.5 + 0.5*(b-a)/k, 0.0, 1.0 );\n\treturn mix( b, a, h ) - k*h*(1.0-h);\n}\n\n#define MOD2 vec2(.16632,.17369)\n#define MOD3 vec3(.16532,.17369,.15787)\nfloat tri(in float x){return abs(fract(x)-.5);}\n\nfloat hash12(vec2 p)\n{\n\tp  = fract(p * MOD2);\n    p += dot(p.xy, p.yx+19.19);\n    return fract(p.x * p.y);\n}\nfloat vine(vec3 p, in float c, in float h)\n{\n    p.y += sin(p.z*.5625+1.3)*3.5-.5;\n    p.x += cos(p.z*2.)*1.;\n    vec2 q = vec2(mod(p.x, c)-c/2., p.y);\n    return length(q) - h*1.4 -sin(p.z*3.+sin(p.x*7.)*0.5)*0.1;\n}\n\n//========================================================================\n// ################ DIFFERENT NOISE FUNCTIONS ################\n#ifdef TRIANGLE_NOISE\nvec3 tri3(in vec3 p){return vec3( tri(p.z+tri(p.y)), tri(p.z+tri(p.x)), tri(p.y+tri(p.x)));}\nfloat Noise3d(in vec3 p)\n{\n    float z=1.4;\n\tfloat rz = 0.;\n    vec3 bp = p;\n\tfor (float i=0.; i<= 2.; i++ )\n\t{\n        vec3 dg = tri3(bp);\n        p += (dg);\n\n        bp *= 2.;\n\t\tz *= 1.5;\n\t\tp *= 1.3;\n        \n        rz+= (tri(p.z+tri(p.x+tri(p.y))))/z;\n        bp += 0.14;\n\t}\n\treturn rz;\n}\n#endif\n\n//--------------------------------------------------------------------------------\n#ifdef FOUR_D_NOISE\n\nvec4 quad(in vec4 p){return abs(fract(p.yzwx+p.wzxy)-.5);}\n\nfloat Noise3d(in vec3 q)\n{\n    float z=1.4;\n    vec4 p = vec4(q, iTime*.1);\n\tfloat rz = 0.;\n    vec4 bp = p;\n\tfor (float i=0.; i<= 2.; i++ )\n\t{\n        vec4 dg = quad(bp);\n        p += (dg);\n\n\t\tz *= 1.5;\n\t\tp *= 1.3;\n        \n        rz+= (tri(p.z+tri(p.w+tri(p.y+tri(p.x)))))/z;\n        \n        bp = bp.yxzw*2.0+.14;\n\t}\n\treturn rz;\n}\n#endif\n\n//--------------------------------------------------------------------------------\n#ifdef TEXTURE_NOISE\nfloat Noise3d(in vec3 x)\n{\n\n    x*=10.0;\n    float h = 0.0;\n    float a = .28;\n    for (int i = 0; i < 4; i++)\n    {\n        vec3 p = floor(x);\n        vec3 f = fract(x);\n        f = f*f*(3.0-2.0*f);\n\n        vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;\n        vec2 rg = textureLod( iChannel0, (uv+ 0.5)/256.0, 0.0 ).yx;\n        h += mix( rg.x, rg.y, f.z )*a;\n        a*=.5;\n        x+=x;\n    }\n    return h;\n}\n#endif\n\n\n//--------------------------------------------------------------------------------\n#ifdef VALUE_NOISE\nfloat Hash(vec3 p)\n{\n\tp  = fract(p * MOD3);\n    p += dot(p.xyz, p.yzx + 19.19);\n    return fract(p.x * p.y * p.z);\n}\n\nfloat Noise3d(in vec3 p)\n{\n    vec2 add = vec2(1.0, 0.0);\n\tp *= 10.0;\n    float h = 0.0;\n    float a = .3;\n    for (int n = 0; n < 4; n++)\n    {\n        vec3 i = floor(p);\n        vec3 f = fract(p); \n        f *= f * (3.0-2.0*f);\n\n        h += mix(\n            mix(mix(Hash(i), Hash(i + add.xyy),f.x),\n                mix(Hash(i + add.yxy), Hash(i + add.xxy),f.x),\n                f.y),\n            mix(mix(Hash(i + add.yyx), Hash(i + add.xyx),f.x),\n                mix(Hash(i + add.yxx), Hash(i + add.xxx),f.x),\n                f.y),\n            f.z)*a;\n         a*=.5;\n        p += p;\n    }\n    return h;\n}\n#endif\n\n//--------------------------------------------------------------------------------\nfloat map(vec3 p)\n{\n    p.y += height(p.zx);\n    float d = p.y+.5;\n    \n    d = smin(d, vine(p+vec3(.8,0.,0),30.,3.3) );\n    d = smin(d, vine(p.zyx+vec3(0.,0,17.),33.,1.4) );\n    d += Noise3d(p*.05)*(p.y*1.2);\n    p.xz *=.3;\n    d+= Noise3d(p*.3);\n    return d;\n}\nfloat fogmap(in vec3 p, in float d)\n{\n    p.xz -= time*7.+sin(p.z*.3)*3.;\n    p.y -= time*.5;\n    return (max(Noise3d(p*.008+.1)-.1,0.0)*Noise3d(p*.1))*.3;\n}\n\nfloat march(in vec3 ro, in vec3 rd, out float drift, in vec2 scUV)\n{\n\tfloat precis = 0.1;\n    float mul = .34;\n    float h;\n    float d = hash12(scUV)*1.5;\n    drift = 0.0;\n    for( int i=0; i<ITR; i++ )\n    {\n        vec3 p = ro+rd*d;\n        h = map(p);\n        if(h < precis*(1.0+d*.05) || d > FAR) break;\n        drift +=  fogmap(p, d);\n        d += h*mul;\n        mul+=.004;\n        //precis +=.001;\n\t }\n    drift = min(drift, 1.0);\n\treturn d;\n}\n\nvec3 normal( in vec3 pos, in float d )\n{\n\tvec2 eps = vec2( d *d* .003+.01, 0.0);\n\tvec3 nor = vec3(\n\t    map(pos+eps.xyy) - map(pos-eps.xyy),\n\t    map(pos+eps.yxy) - map(pos-eps.yxy),\n\t    map(pos+eps.yyx) - map(pos-eps.yyx) );\n\treturn normalize(nor);\n}\n\nfloat bnoise(in vec3 p)\n{\n    p.xz*=.4;\n    float n = Noise3d(p*3.)*0.4;\n    n += Noise3d(p*1.5)*0.2;\n    return n*n*.2;\n}\n\nvec3 bump(in vec3 p, in vec3 n, in float ds)\n{\n    p.xz *= .4;\n    //p *= 1.0;\n    vec2 e = vec2(.01,0);\n    float n0 = bnoise(p);\n    vec3 d = vec3(bnoise(p+e.xyy)-n0, bnoise(p+e.yxy)-n0, bnoise(p+e.yyx)-n0)/e.x;\n    n = normalize(n-d*10./(ds));\n    return n;\n}\n\nfloat shadow(in vec3 ro, in vec3 rd, in float mint)\n{\n\tfloat res = 1.0;\n    \n    float t = mint;\n    for( int i=0; i<12; i++ )\n    {\n\t\tfloat h = map(ro + rd*t);\n        res = min( res, 4.*h/t );\n        t += clamp( h, 0.1, 1.5 );\n            }\n    return clamp( res, 0., 1.0 );\n}\n\nvec3 Clouds(vec3 sky, vec3 rd)\n{\n    \n    rd.y = max(rd.y, 0.0);\n    float ele = rd.y;\n    float v = (200.0)/(abs(rd.y)+.01);\n\n    rd.y = v;\n    rd.xz = rd.xz * v - time*8.0;\n\trd.xz *= .0004;\n    \n\tfloat f = Noise3d(rd.xzz*3.) * Noise3d(rd.zxx*1.3)*2.5;\n    f = f*pow(ele, .5)*2.;\n  \tf = clamp(f-.15, 0.01, 1.0);\n\n    return  mix(sky, vec3(1),f );\n}\n\n\nvec3 Sky(vec3 rd, vec3 ligt)\n{\n    rd.y = max(rd.y, 0.0);\n    \n    vec3 sky = mix(vec3(.1, .15, .25), vec3(.8), pow(.8-rd.y, 3.0));\n    return  mix(sky, SUN_COLOUR, min(pow(max(dot(rd,ligt), 0.0), 4.5)*1.2, 1.0));\n}\nfloat Occ(vec3 p)\n{\n    float h = 0.0;\n    h  = clamp(map(p), 0.5, 1.0);\n \treturn sqrt(h);   \n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\t\n\tvec2 p = fragCoord.xy/iResolution.xy-0.5;\n    vec2 q = fragCoord.xy/iResolution.xy;\n\tp.x*=iResolution.x/iResolution.y;\n    vec2 mo = iMouse.xy / iResolution.xy-.5;\n    mo = (mo==vec2(-.5))?mo=vec2(-0.1,0.07):mo;\n\tmo.x *= iResolution.x/iResolution.y;\n\t\n\tvec3 ro = vec3(0.+smoothstep(0.,1.,tri(time*1.5)*.3)*1.5, smoothstep(0.,1.,tri(time*3.)*3.)*0.08, -time*3.5-130.0);\n    ro.y -= camHeight(ro.zx)-.4;\n    mo.x += smoothstep(0.7,1.,sin(time*.35))*.5-1.5 - smoothstep(-.7,-1.,sin(time*.35))*.5;\n \n    vec3 eyedir = normalize(vec3(cos(mo.x),mo.y*2.-.05+sin(time*.5)*0.1,sin(mo.x)));\n    vec3 rightdir = normalize(vec3(cos(mo.x+1.5708),0.,sin(mo.x+1.5708)));\n    vec3 updir = normalize(cross(rightdir,eyedir));\n\tvec3 rd=normalize((p.x*rightdir+p.y*updir)*1.+eyedir);\n\t\n    vec3 ligt = normalize( vec3(1.5, .9, -.5) );\n    float fg;\n\tfloat rz = march(ro,rd, fg, fragCoord);\n\tvec3 sky = Sky(rd, ligt);\n    \n    vec3 col = sky;\n   \n    if ( rz < FAR )\n    {\n        vec3 pos = ro+rz*rd;\n        vec3 nor= normal( pos, rz);\n        float d = distance(pos,ro);\n        nor = bump(pos,nor,d);\n        float shd = (shadow(pos,ligt,.04));\n        \n        float dif = clamp( dot( nor, ligt ), 0.0, 1.0 );\n        vec3 ref = reflect(rd,nor);\n        float spe = pow(clamp( dot( ref, ligt ), 0.0, 1.0 ),5.)*2.;\n\n        float fre = pow( clamp(1.+dot(rd, nor),0.0,1.0), 3. );\n        col = vec3(.75);\n\t    col = col*dif*shd + fre*spe*shd*SUN_COLOUR +abs(nor.y)*vec3(.12, .13, .13);\n        // Fake the red absorption of ice...\n        d = Occ(pos+nor*3.);\n        col *= vec3(d, d, min(d*1.2, 1.0));\n        // Fog from ice storm...\n        col = mix(col, sky, smoothstep(FAR-25.,FAR,rz));\n        \n    }\n    else\n    {\n        col = Clouds(col, rd);\n    }\n    \n\n    // Fog mix...\n    col = mix(col, vec3(0.6, .65, .7), fg);\n  \n    // Post...\n    col = mix(col, vec3(.5), -.3);\n    //col = col*col * (3.0-2.0*col);\n\t//col = clamp(pow(col,vec3(1.5)),0.0, 1.0);\n\n\tcol = sqrt(col);\n    \n    \n    // Borders...\n    float f = smoothstep(0.0, 3.0, iTime)*.5;\n    col *= f+f*pow(70. *q.x*q.y*(1.0-q.x)*(1.0-q.y), .2);\n    \n    \n\tfragColor = vec4( col, 1.0 );\n}\n",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": true,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "Xls3D2",
          "date": "1425324501",
          "viewed": 20617,
          "name": "Frozen wasteland",
          "username": "Dave_Hoskins",
          "description": "Frozen wasteland. Built on nimitz's model, although I didn't use his fog stuff after all. It uses fog ray tracing included within the main ray march. Which means it tends to be thicker in the smaller ray incremental areas near objects.",
          "likes": 346,
          "published": 3,
          "flags": 8,
          "usePreview": 0,
          "tags": [
            "3d",
            "raymarching",
            "clouds",
            "fog",
            "frozenwasteland"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);