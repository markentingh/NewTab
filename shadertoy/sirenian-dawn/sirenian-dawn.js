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
            "code": "// Sirenian Dawn by nimitz (twitter: @stormoid)\n// https://www.shadertoy.com/view/XsyGWV\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n/*\n\tSee: https://en.wikipedia.org/wiki/Terra_Sirenum\n\n\tThings of interest in this shader:\n\t\t-A technique I call \"relaxation marching\", see march() function\n\t\t-A buffer based technique for anti-alisaing\n\t\t-Cheap and smooth procedural starfield\n\t\t-Non-constant fog from iq\n\t\t-Completely faked atmosphere :)\n\t\t-Terrain based on noise derivatives\n*/\n\n/*\n\tMore about the antialiasing:\n\t\tThe fragments with high enough iteration count/distance ratio \n\t\tget blended with the past frame, I tried a few different \n\t\tinput for the blend trigger: distance delta, color delta, \n\t\tnormal delta, scene curvature.  But none of them provides \n\t\tgood enough info about the problem areas to allow for proper\n\t\tantialiasing without making the whole scene blurry.\n\t\t\n\t\tOn the other hand iteration count (modulated by a power\n\t\tof distance) does a pretty good job without requiring to\n\t\tstore past frame info in the alpha channel (which can then\n\t\tbe used for something else, nothing in this case)\n\n*/\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tfragColor = vec4(texture(iChannel0, fragCoord.xy/iResolution.xy).rgb, 1.0);\n}",
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
            "inputs": [
              {
                "channel": 0,
                "type": "texture",
                "id": "4dXGzn",
                "filepath": "/media/a/0c7bf5fe9462d5bffbd11126e82908e39be3ce56220d900f633d58fb432e56f5.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
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
            "code": "//Sirenian Dawn by nimitz (twitter: @stormoid)\n// https://www.shadertoy.com/view/XsyGWV\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n\n#define ITR 90\n#define FAR 400.\n#define time iTime\n\nconst vec3 lgt = vec3(-.523, .41, -.747);\nmat2 m2 = mat2( 0.80,  0.60, -0.60,  0.80 );\n\n//form iq, see: https://iquilezles.org/articles/morenoise\nvec3 noised( in vec2 x )\n{\n    vec2 p = floor(x);\n    vec2 f = fract(x);\n    vec2 u = f*f*(3.0-2.0*f);\n\tfloat a = textureLod(iChannel0,(p+vec2(0.5,0.5))/256.0,0.0).x;\n\tfloat b = textureLod(iChannel0,(p+vec2(1.5,0.5))/256.0,0.0).x;\n\tfloat c = textureLod(iChannel0,(p+vec2(0.5,1.5))/256.0,0.0).x;\n\tfloat d = textureLod(iChannel0,(p+vec2(1.5,1.5))/256.0,0.0).x;\n\treturn vec3(a+(b-a)*u.x+(c-a)*u.y+(a-b-c+d)*u.x*u.y,\n\t\t\t\t6.0*f*(1.0-f)*(vec2(b-a,c-a)+(a-b-c+d)*u.yx));\n}\n\nfloat terrain( in vec2 p)\n{\n    float rz = 0.;\n    float z = 1.;\n\tvec2  d = vec2(0.0);\n    float scl = 2.95;\n    float zscl = -.4;\n    float zz = 5.;\n    for( int i=0; i<5; i++ )\n    {\n        vec3 n = noised(p);\n        d += pow(abs(n.yz),vec2(zz));\n        d -= smoothstep(-.5,1.5,n.yz);\n        zz -= 1.;\n        rz += z*n.x/(dot(d,d)+.85);\n        z *= zscl;\n        zscl *= .8;\n        p = m2*p*scl;\n    }\n    \n    rz /= smoothstep(1.5,-.5,rz)+.75;\n    return rz;\n}\n\nfloat map(vec3 p)\n{\n    return p.y-(terrain(p.zx*0.07))*2.7-1.;\n}\n\n/*\tThe idea is simple, as the ray gets further from the eye, I increase \n\tthe step size of the raymarching and lower the target precision, \n\tthis allows for better performance with virtually no loss in visual quality. */\nfloat march(in vec3 ro, in vec3 rd, out float itrc)\n{\n    float t = 0.;\n    float d = map(rd*t+ro);\n    float precis = 0.0001;\n    for (int i=0;i<=ITR;i++)\n    {\n        if (abs(d) < precis || t > FAR) break;\n        precis = t*0.0001;\n        float rl = max(t*0.02,1.);\n        t += d*rl;\n        d = map(rd*t+ro)*0.7;\n        itrc++;\n    }\n\n    return t;\n}\n\nvec3 rotx(vec3 p, float a){\n    float s = sin(a), c = cos(a);\n    return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);\n}\n\nvec3 roty(vec3 p, float a){\n    float s = sin(a), c = cos(a);\n    return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);\n}\n\nvec3 rotz(vec3 p, float a){\n    float s = sin(a), c = cos(a);\n    return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z);\n}\n\nvec3 normal(in vec3 p, in float ds)\n{  \n    vec2 e = vec2(-1., 1.)*0.0005*pow(ds,1.);\n\treturn normalize(e.yxx*map(p + e.yxx) + e.xxy*map(p + e.xxy) + \n\t\t\t\t\t e.xyx*map(p + e.xyx) + e.yyy*map(p + e.yyy) );   \n}\n\nfloat noise(in vec2 x){return texture(iChannel0, x*.01).x;}\nfloat fbm(in vec2 p)\n{\t\n\tfloat z=.5;\n\tfloat rz = 0.;\n\tfor (float i= 0.;i<3.;i++ )\n\t{\n        rz+= (sin(noise(p)*5.)*0.5+0.5) *z;\n\t\tz *= 0.5;\n\t\tp = p*2.;\n\t}\n\treturn rz;\n}\n\nfloat bnoise(in vec2 p){ return fbm(p*3.); }\nvec3 bump(in vec3 p, in vec3 n, in float ds)\n{\n    vec2 e = vec2(0.005*ds,0);\n    float n0 = bnoise(p.zx);\n    vec3 d = vec3(bnoise(p.zx+e.xy)-n0, 1., bnoise(p.zx+e.yx)-n0)/e.x*0.025;\n    d -= n*dot(n,d);\n    n = normalize(n-d);\n    return n;\n}\n\nfloat curv(in vec3 p, in float w)\n{\n    vec2 e = vec2(-1., 1.)*w;   \n    float t1 = map(p + e.yxx), t2 = map(p + e.xxy);\n    float t3 = map(p + e.xyx), t4 = map(p + e.yyy);\n    return .15/e.y *(t1 + t2 + t3 + t4 - 4. * map(p));\n}\n\n//Based on: https://iquilezles.org/articles/fog\nvec3 fog(vec3 ro, vec3 rd, vec3 col, float ds)\n{\n    vec3 pos = ro + rd*ds;\n    float mx = (fbm(pos.zx*0.1-time*0.05)-0.5)*.2;\n    \n    const float b= 1.;\n    float den = 0.3*exp(-ro.y*b)*(1.0-exp( -ds*rd.y*b ))/rd.y;\n    float sdt = max(dot(rd, lgt), 0.);\n    vec3  fogColor  = mix(vec3(0.5,0.2,0.15)*1.2, vec3(1.1,0.6,0.45)*1.3, pow(sdt,2.0)+mx*0.5);\n    return mix( col, fogColor, clamp(den + mx,0.,1.) );\n}\n\nfloat linstep(in float mn, in float mx, in float x){\n\treturn clamp((x - mn)/(mx - mn), 0., 1.);\n}\n\n//Complete hack, but looks good enough :)\nvec3 scatter(vec3 ro, vec3 rd)\n{   \n    float sd= max(dot(lgt, rd)*0.5+0.5,0.);\n    float dtp = 13.-(ro + rd*(FAR)).y*3.5;\n    float hori = (linstep(-1500., 0.0, dtp) - linstep(11., 500., dtp))*1.;\n    hori *= pow(sd,.04);\n    \n    vec3 col = vec3(0);\n    col += pow(hori, 200.)*vec3(1.0, 0.7,  0.5)*3.;\n    col += pow(hori, 25.)* vec3(1.0, 0.5,  0.25)*.3;\n    col += pow(hori, 7.)* vec3(1.0, 0.4, 0.25)*.8;\n    \n    return col;\n}\n\nvec3 nmzHash33(vec3 q)\n{\n    uvec3 p = uvec3(ivec3(q));\n    p = p*uvec3(374761393U, 1103515245U, 668265263U) + p.zxy + p.yzx;\n    p = p.yzx*(p.zxy^(p >> 3U));\n    return vec3(p^(p >> 16U))*(1.0/vec3(0xffffffffU));\n}\n\n//Very happy with this star function, cheap and smooth\nvec3 stars(in vec3 p)\n{\n    vec3 c = vec3(0.);\n    float res = iResolution.x*0.8;\n    \n\tfor (float i=0.;i<3.;i++)\n    {\n        vec3 q = fract(p*(.15*res))-0.5;\n        vec3 id = floor(p*(.15*res));\n        vec2 rn = nmzHash33(id).xy;\n        float c2 = 1.-smoothstep(0.,.6,length(q));\n        c2 *= step(rn.x,.0005+i*i*0.001);\n        c += c2*(mix(vec3(1.0,0.49,0.1),vec3(0.75,0.9,1.),rn.y)*0.25+0.75);\n        p *= 1.4;\n    }\n    return c*c*.7;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\t\n\tvec2 q = fragCoord.xy / iResolution.xy;\n    vec2 p = q - 0.5;\n\tp.x*=iResolution.x/iResolution.y;\n\tvec2 mo = iMouse.xy / iResolution.xy-.5;\n    mo = (mo==vec2(-.5))?mo=vec2(-.2,0.3):mo;\n    mo.x *= 1.2;\n    mo -= vec2(1.2,-0.1);\n\tmo.x *= iResolution.x/iResolution.y;\n    mo.x += sin(time*0.15)*0.2;\n\t\n    vec3 ro = vec3(650., sin(time*0.2)*0.25+10.,-time);\n    vec3 eye = normalize(vec3(cos(mo.x),-0.5+mo.y,sin(mo.x)));\n    vec3 right = normalize(vec3(cos(mo.x+1.5708),0.,sin(mo.x+1.5708)));\n    vec3 up = normalize(cross(right, eye));\n\tvec3 rd = normalize((p.x*right + p.y*up)*1.05 + eye);\n    rd.y += abs(p.x*p.x*0.015);\n    rd = normalize(rd);\n\t\n    float count = 0.;\n\tfloat rz = march(ro,rd, count);\n    \n    vec3 scatt = scatter(ro, rd);\n    \n    vec3 bg = stars(rd)*(1.0-clamp(dot(scatt, vec3(1.3)),0.,1.));\n    vec3 col = bg;\n    \n    vec3 pos = ro+rz*rd;\n    vec3 nor= normal( pos, rz );\n    if ( rz < FAR )\n    {\n        nor = bump(pos,nor,rz);\n        float amb = clamp( 0.5+0.5*nor.y, 0.0, 1.0 );\n        float dif = clamp( dot( nor, lgt ), 0.0, 1.0 );\n        float bac = clamp( dot( nor, normalize(vec3(-lgt.x,0.0,-lgt.z))), 0.0, 1.0 );\n        float spe = pow(clamp( dot( reflect(rd,nor), lgt ), 0.0, 1.0 ),500.);\n        float fre = pow( clamp(1.0+dot(nor,rd),0.0,1.0), 2.0 );\n        vec3 brdf = 1.*amb*vec3(0.10,0.11,0.12);\n        brdf += bac*vec3(0.15,0.05,0.04);\n        brdf += 2.3*dif*vec3(.9,0.4,0.25);\n        col = vec3(0.25,0.25,0.3);\n        float crv = curv(pos, 2.)*1.;\n        float crv2 = curv(pos, .4)*2.5;\n        \n        col += clamp(crv*0.9,-1.,1.)*vec3(0.25,.6,.5);\n        col = col*brdf + col*spe*.1 +.1*fre*col;\n        col *= crv*1.+1.;\n        col *= crv2*1.+1.;\n    }\n\t\n    col = fog(ro, rd, col, rz);\n    col = mix(col,bg,smoothstep(FAR-150., FAR, rz));\n    col += scatt;\n    \n    col = pow( col, vec3(0.93,1.0,1.0) );\n    col = mix(col, smoothstep(0.,1.,col), 0.2);\n    col *= pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1)*0.9+0.1;\n    \n    vec4 past = texture(iChannel1, q);\n    float tOver = clamp(iTimeDelta-(1./60.),0.,1.);\n    \n    //if (count/pow(rz, 0.65) > 3.3) col = mix(col, past.rgb, clamp(1.0-iResolution.x*0.0003,0.,1.));\n    if (count/pow(rz, 0.65) > 3.3) col = mix(col, past.rgb, clamp(0.85-iTimeDelta*7.,0.,1.));\n    \n\tfragColor = vec4(col, 1.0);\n}",
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
          "mFlagMusicStream": false
        },
        "info": {
          "id": "XsyGWV",
          "date": "1458155905",
          "viewed": 37529,
          "name": "Sirenian Dawn",
          "username": "nimitz",
          "description": "Experiments in raymarched terrain rendering.",
          "likes": 632,
          "published": 1,
          "flags": 32,
          "usePreview": 0,
          "tags": [
            "fog",
            "mars",
            "aa",
            "atmosphere",
            "dawn"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);