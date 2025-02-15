var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
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
            "code": "// srtuss, 2015\n//\n// Volumetric cloud tunnel, a single light source, lightning and raindrops.\n//\n// The code is a bit messy, but in this case it's visuals that count. :P\n\n\n#define pi 3.1415926535897932384626433832795\n\nstruct ITSC\n{\n\tvec3 p;\n\tfloat dist;\n\tvec3 n;\n    vec2 uv;\n};\n\nITSC raycylh(vec3 ro, vec3 rd, vec3 c, float r)\n{\n\tITSC i;\n\ti.dist = 1e38;\n\tvec3 e = ro - c;\n\tfloat a = dot(rd.xy, rd.xy);\n\tfloat b = 2.0 * dot(e.xy, rd.xy);\n\tfloat cc = dot(e.xy, e.xy) - r;\n\tfloat f = b * b - 4.0 * a * cc;\n\tif(f > 0.0)\n\t{\n\t\tf = sqrt(f);\n\t\tfloat t = (-b + f) / (2.0 * a);\n\t\t\n\t\tif(t > 0.001)\n\t\t{\n\t\t\ti.dist = t;\n\t\t\ti.p = e + rd * t;\n\t\t\ti.n = -vec3(normalize(i.p.xy), 0.0);\n\t\t}\n\t}\n\treturn i;\n}\n\nvoid tPlane(inout ITSC hit, vec3 ro, vec3 rd, vec3 o, vec3 n, vec3 tg, vec2 si)\n{\n    vec2 uv;\n    ro -= o;\n    float t = -dot(ro, n) / dot(rd, n);\n    if(t < 0.0)\n        return;\n    vec3 its = ro + rd * t;\n    uv.x = dot(its, tg);\n    uv.y = dot(its, cross(tg, n));\n    if(abs(uv.x) > si.x || abs(uv.y) > si.y)\n        return;\n    \n    //if(t < hit.dist)\n    {\n        hit.dist = t;\n        hit.uv = uv;\n    }\n    return;\n}\n\n\nfloat hsh(float x)\n{\n    return fract(sin(x * 297.9712) * 90872.2961);\n}\n\nfloat nseI(float x)\n{\n    float fl = floor(x);\n    return mix(hsh(fl), hsh(fl + 1.0), smoothstep(0.0, 1.0, fract(x)));\n}\n\nvec2 rotate(vec2 p, float a)\n{\n\treturn vec2(p.x * cos(a) - p.y * sin(a), p.x * sin(a) + p.y * cos(a));\n}\n\nfloat nse3d(in vec3 x)\n{\n    vec3 p = floor(x);\n    vec3 f = fract(x);\n\tf = f * f * (3.0 - 2.0 * f);\n\tvec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;\n\tvec2 rg = textureLod( iChannel0, (uv+.5)/256., 0.).yx;\n\treturn mix(rg.x, rg.y, f.z);\n}\n\nfloat nse(vec2 p)\n{\n    return texture(iChannel0, p).x;\n}\n\nfloat density2(vec2 p, float z, float t)\n{\n    float v = 0.0;\n    float fq = 1.0, am = 0.5, mvfd = 1.0;\n    vec2 rnd = vec2(0.3, 0.7);\n    for(int i = 0; i < 7; i++)\n    {\n        rnd = fract(sin(rnd * 14.4982) * 2987253.28612);\n        v += nse(p * fq + t * (rnd - 0.5)) * am;\n        fq *= 2.0;\n        am *= 0.5;\n        mvfd *= 1.3;\n    }\n    return v * exp(z * z * -2.0);\n}\n\nfloat densA = 1.0, densB = 2.0;\n\nfloat fbm(vec3 p)\n{\n    vec3 q = p;\n    //q.xy = rotate(p.xy, iTime);\n    \n    p += (nse3d(p * 3.0) - 0.5) * 0.3;\n    \n    //float v = nse3d(p) * 0.5 + nse3d(p * 2.0) * 0.25 + nse3d(p * 4.0) * 0.125 + nse3d(p * 8.0) * 0.0625;\n    \n    //p.y += iTime * 0.2;\n    \n    float mtn = iTime * 0.15;\n    \n    float v = 0.0;\n    float fq = 1.0, am = 0.5;\n    for(int i = 0; i < 6; i++)\n    {\n        v += nse3d(p * fq + mtn * fq) * am;\n        fq *= 2.0;\n        am *= 0.5;\n    }\n    return v;\n}\n\nfloat fbmHQ(vec3 p)\n{\n    vec3 q = p;\n    q.xy = rotate(p.xy, iTime);\n    \n    p += (nse3d(p * 3.0) - 0.5) * 0.4;\n    \n    //float v = nse3d(p) * 0.5 + nse3d(p * 2.0) * 0.25 + nse3d(p * 4.0) * 0.125 + nse3d(p * 8.0) * 0.0625;\n    \n    //p.y += iTime * 0.2;\n    \n    float mtn = iTime * 0.2;\n    \n    float v = 0.0;\n    float fq = 1.0, am = 0.5;\n    for(int i = 0; i < 9; i++)\n    {\n        v += nse3d(p * fq + mtn * fq) * am;\n        fq *= 2.0;\n        am *= 0.5;\n    }\n    return v;\n}\n\nfloat density(vec3 p)\n{\n    vec2 pol = vec2(atan(p.y, p.x), length(p.yx));\n    \n    float v = fbm(p);\n    \n    float fo = (pol.y - 1.5);//(densA + densB) * 0.5);\n    //fo *= (densB - densA);\n    v *= exp(fo * fo * -5.0);\n    \n    float edg = 0.3;\n    return smoothstep(edg, edg + 0.1, v);\n}\n\nfloat densityHQ(vec3 p)\n{\n    vec2 pol = vec2(atan(p.y, p.x), length(p.yx));\n    \n    float v = fbmHQ(p);\n    \n    float fo = (pol.y - 1.5);//(densA + densB) * 0.5);\n    //fo *= (densB - densA);\n    v *= exp(fo * fo * -5.0);\n    \n    float edg = 0.3;\n    return smoothstep(edg, edg + 0.1, v);\n}\n\nvec2 drop(inout vec2 p)\n{\n    vec2 mv = iTime * vec2(0.5, -1.0) * 0.15;\n    \n    float drh = 0.0;\n    float hl = 0.0;\n    \n    vec4 rnd = vec4(0.1, 0.2, 0.3, 0.4);\n    for(int i = 0; i < 20; i++)\n    {\n        rnd = fract(sin(rnd * 2.184972) * 190723.58961);\n        float fd = fract(iTime * 0.2 + rnd.w);\n        fd = exp(fd * -4.0);\n        float r = 0.025 * (rnd.w * 1.5 + 1.0);\n        float sz = 0.35;\n        \n        \n        vec2 q = (fract((p - mv) * sz + rnd.xy) - 0.5) / sz;\n        mv *= 1.06;\n        \n        q.y *= -1.0;\n        float l = length(q + pow(abs(dot(q, vec2(1.0, 0.4))), 0.7) * (fd * 0.2 + 0.1));\n        if(l < r)\n        {\n        \tfloat h = sqrt(r * r - l * l);\n        \tdrh = max(drh, h * fd);\n        }\n        hl += exp(length(q - vec2(-0.02, 0.01)) * -30.0) * 0.4 * fd;\n    }\n    p += drh * 5.0;\n    return vec2(drh, hl);\n}\n\n\nfloat hash1(float p)\n{\n\treturn fract(sin(p * 172.435) * 29572.683) - 0.5;\n}\n\nfloat hash2(vec2 p)\n{\n\tvec2 r = (456.789 * sin(789.123 * p.xy));\n\treturn fract(r.x * r.y * (1.0 + p.x));\n}\n\nfloat ns(float p)\n{\n\tfloat fr = fract(p);\n\tfloat fl = floor(p);\n\treturn mix(hash1(fl), hash1(fl + 1.0), fr);\n}\n\nfloat fbm(float p)\n{\n\treturn (ns(p) * 0.4 + ns(p * 2.0 - 10.0) * 0.125 + ns(p * 8.0 + 10.0) * 0.025);\n}\n\nfloat fbmd(float p)\n{\n\tfloat h = 0.01;\n\treturn atan(fbm(p + h) - fbm(p - h), h);\n}\n\nfloat arcsmp(float x, float seed)\n{\n\treturn fbm(x * 3.0 + seed * 1111.111) * (1.0 - exp(-x * 5.0));\n}\n\nfloat arc(vec2 p, float seed, float len)\n{\n\tp *= len;\n\t//p = rotate(p, iTime);\n\tfloat v = abs(p.y - arcsmp(p.x, seed));\n\tv += exp((2.0 - p.x) * -4.0);\n\tv = exp(v * -60.0) + exp(v * -10.0) * 0.6;\n\t//v += exp(p.x * -2.0);\n\tv *= smoothstep(0.0, 0.05, p.x);\n\treturn v;\n}\n\nfloat arcc(vec2 p, float sd)\n{\n\tfloat v = 0.0;\n\tfloat rnd = fract(sd);\n\tfloat sp = 0.0;\n\tv += arc(p, sd, 1.0);\n\tfor(int i = 0; i < 4; i ++)\n\t{\n\t\tsp = rnd + 0.01;\n\t\tvec2 mrk = vec2(sp, arcsmp(sp, sd));\n\t\tv += arc(rotate(p - mrk, fbmd(sp)), mrk.x, mrk.x * 0.4 + 1.5);\n\t\trnd = fract(sin(rnd * 195.2837) * 1720.938);\n\t}\n\treturn v;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 uv = fragCoord.xy / iResolution.xy;\n    \n    uv = 2.0 * uv - 1.0;\n    uv.x *= iResolution.x / iResolution.y;\n    \n    vec2 drh = drop(uv);\n    \n    float camtm = iTime * 0.15;\n    vec3 ro = vec3(cos(camtm), 0.0, camtm);\n    vec3 rd = normalize(vec3(uv, 1.2));\n    rd.xz = rotate(rd.xz, sin(camtm) * 0.4);\n    rd.yz = rotate(rd.yz, sin(camtm * 1.3) * 0.4);\n    \n    vec3 sun = normalize(vec3(0.2, 1.0, 0.1));\n    \n    float sd = sin(fragCoord.x * 0.01 + fragCoord.y * 3.333333333 + iTime) * 1298729.146861;\n    \n    vec3 col;\n    float dacc = 0.0, lacc = 0.0;\n    \n    vec3 light = vec3(cos(iTime * 8.0) * 0.5, sin(iTime * 4.0) * 0.5, ro.z + 4.0 + sin(iTime));\n    \n    ITSC tunRef;\n    #define STP 15\n    for(int i = 0; i < STP; i++)\n    {\n        ITSC itsc = raycylh(ro, rd, vec3(0.0), densB + float(i) * (densA - densB) / float(STP) + fract(sd) * 0.07);\n        float d = density(itsc.p);\n        vec3 tol = light - itsc.p;\n        float dtol = length(tol);\n        tol = tol * 0.1 / dtol;\n        \n        float dl = density(itsc.p + tol);\n        lacc += max(d - dl, 0.0) * exp(dtol * -0.2);\n        dacc += d;\n        tunRef = itsc;\n    }\n    dacc /= float(STP);\n    ITSC itsc = raycylh(ro, rd, vec3(0.0), 4.0);\n    vec3 sky = vec3(0.6, 0.3, 0.2);\n    sky *= 0.9 * pow(fbmHQ(itsc.p), 2.0);\n    lacc = max(lacc * 0.3 + 0.3, 0.0);\n    vec3 cloud = pow(vec3(lacc), vec3(0.7, 1.0, 1.0) * 1.0);\n    col = mix(sky, cloud, dacc);\n    col *= exp(tunRef.dist * -0.1);\n    col += drh.y;\n    \n    vec4 rnd = vec4(0.1, 0.2, 0.3, 0.4);\n    float arcv = 0.0, arclight = 0.0;\n    for(int i = 0; i < 3; i++)\n    {\n        float v = 0.0;\n        rnd = fract(sin(rnd * 1.111111) * 298729.258972);\n        float ts = rnd.z * 4.0 * 1.61803398875 + 1.0;\n        float arcfl = floor(iTime / ts + rnd.y) * ts;\n        float arcfr = fract(iTime / ts + rnd.y) * ts;\n        \n        ITSC arcits;\n        arcits.dist = 1e38;\n        float arca = rnd.x + arcfl * 2.39996;\n        float arcz = ro.z + 1.0 + rnd.x * 12.0;\n        tPlane(arcits, ro, rd, vec3(0.0, 0.0, arcz), vec3(0.0, 0.0, -1.0), vec3(cos(arca), sin(arca), 0.0), vec2(2.0));\n\n        float arcseed = floor(iTime * 17.0 + rnd.y);\n        if(arcits.dist < 20.0)\n        {\n            arcits.uv *= 0.8;\n            v = arcc(vec2(1.0 - abs(arcits.uv.x), arcits.uv.y * sign(arcits.uv.x)) * 1.4, arcseed * 0.033333);\n        }\n\t\tfloat arcdur = rnd.x * 0.2 + 0.05;\n        float arcint = smoothstep(0.1 + arcdur, arcdur, arcfr);\n        v *= arcint;\n        arcv += v;\n        arclight += exp(abs(arcz - tunRef.p.z) * -0.3) * fract(sin(arcseed) * 198721.6231) * arcint;\n    }\n    vec3 arccol = vec3(0.9, 0.7, 0.7);\n    col += arclight * arccol * 0.5;\n    col = mix(col, arccol, clamp(arcv, 0.0, 1.0));\n    col = pow(col, vec3(1.0, 0.8, 0.5) * 1.5) * 1.5;\n    col = pow(col, vec3(1.0 / 2.2));\n\tfragColor = vec4(col, 1.0);\n}",
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
          "id": "XlsGRs",
          "date": "1424377905",
          "viewed": 13148,
          "name": "jetstream",
          "username": "srtuss",
          "description": "something i made some moths ago, when i was experimenting with volumetric stuff.",
          "likes": 320,
          "published": 1,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "clouds",
            "rain",
            "lightning",
            "calm"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);