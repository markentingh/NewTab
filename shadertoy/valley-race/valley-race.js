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
                  "filter": "nearest",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "buffer",
                "id": "XsXGR8",
                "filepath": "/media/previz/buffer01.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "float rand(vec2 co){\n    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    \n    vec2 uv = fragCoord.xy / iResolution.xy;\n    fragColor.rgb = texture(iChannel1, uv).rgb;\n    fragColor.rgb = smoothstep(0.0, 1.0, fragColor.rgb);\n    fragColor.rgb += 0.006 * 0.5 * (rand(uv + iTime) + rand(uv + vec2(0.1) + iTime));\n    fragColor.rgb = pow(fragColor.rgb, vec3(1.0 / 2.2));\n    \n    \n}",
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
              },
              {
                "channel": 1,
                "type": "texture",
                "id": "4df3Rr",
                "filepath": "/media/a/3871e838723dd6b166e490664eead8ec60aedd6b8d95bc8e2fe3f882f0fd90f0.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 2,
                "type": "texture",
                "id": "4sf3Rn",
                "filepath": "/media/a/0a40562379b63dfb89227e6d172f39fdce9022cba76623f1054a2c83d6c0ba5d.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 3,
                "type": "cubemap",
                "id": "XsX3zn",
                "filepath": "/media/a/94284d43be78f00eb6b298e6d78656a1b34e2b91b34940d02f1ca8b22310e8a0.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "/**\n Shader inspired by Star Wars I pod-racing scene. Spent a long time tweaking shading and geometry, \n I hope it runs reasonably well and looks good, I even tried to optimize this time :)\n*/\n\n\nmat3 rotx(float a) { mat3 rot; rot[0] = vec3(1.0, 0.0, 0.0); rot[1] = vec3(0.0, cos(a), -sin(a)); rot[2] = vec3(0.0, sin(a), cos(a)); return rot; }\nmat3 roty(float a) { mat3 rot; rot[0] = vec3(cos(a), 0.0, sin(a)); rot[1] = vec3(0.0, 1.0, 0.0); rot[2] = vec3(-sin(a), 0.0, cos(a)); return rot; }\nmat3 rotz(float a) { mat3 rot; rot[0] = vec3(cos(a), -sin(a), 0.0); rot[1] = vec3(sin(a), cos(a), 0.0); rot[2] = vec3(0.0, 0.0, 1.0); return rot; }\n//mat3 transpose(in mat3 m) { mat3 mT; mT[0][0] = m[0][0]; mT[0][1] = m[1][0]; mT[0][2] = m[2][0]; mT[1][0] = m[0][1]; mT[1][1] = m[1][1]; mT[1][2] = m[2][1]; mT[2][0] = m[0][2]; mT[2][1] = m[1][2]; mT[2][2] = m[2][2]; return mT; }\nconst float PI = 3.14159265358;\nconst float PI2 = 3.14159265358 * 0.5;\nconst float TWO_PI = 3.14159265358 * 2.0;\nfloat getShipRoll(float T);\nfloat shadowEnv (in vec3 rp, in vec3 g, in vec3 ld);\n\n\n// from IQ: https://iquilezles.org/articles/smin\nfloat smin( float a, float b, float k )\n{\n    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );\n    return mix( b, a, h ) - k*h*(1.0-h);\n}\n// from IQ: https://iquilezles.org/articles/distfunctions\nfloat sdBox( vec3 p, vec3 b )\n{\n  vec3 d = abs(p) - b;\n  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));\n}\n\n// plane looks down negative z axis. Orientation is controlled by rotation matrix.\nfloat traceQuad(in vec3 ro, in vec3 rd, in vec3 pp, in vec2 sizeXY, in mat3 rt, in vec3 pivot )\n{\n    pp += rt * pivot;\n    vec3 pn = rt * vec3(0.0, .0, -1.00);\n    float a = dot(pp - ro, pn);\n    float b = dot(rd, pn);\n    float t = a / b;\n    if (t < 0.0) return t;\n    vec3 hitp = ro + rd * t;\n    hitp = transpose(rt) * (hitp - pp); // to get to local coordinates\n    if(abs(hitp.x) > sizeXY.x) return -1.;\n    if(abs(hitp.y) > sizeXY.y) return -1.;\n\treturn t;\n}\n\n// just a small helper function for bounding box tracing\nfloat pmin(float m1, float m2)\n{\n    if (m1 >= 0.0 && m2 >= 0.0) { return min(m1, m2); } \n    return (m1 >= 0.0 && m2 < 0.0) ? m1 : m2;\n}\n\n// 6 quad checks\n// returns ray enter and exit hitpoints.\n// I'm using this as a bounding box to speedup the tracing process.\nvec2 traceBox(in vec3 ro, in vec3 rd, in vec3 bp, in vec3 size, in mat3 rt)\n{\n    vec4 piv = vec4(size, 0.0);\n    float f0 = traceQuad(ro, rd, bp, size.xy, rt, piv.wwz);\n\tfloat f1 = traceQuad(ro, rd, bp, size.xy * 1., rt, -piv.wwz);\n\tfloat f2 = traceQuad(ro, rd, bp, size.zy, rt * roty(PI2), piv.wwx);\n\tfloat f3 = traceQuad(ro, rd, bp, size.zy, rt * roty(PI2), -piv.wwx);\n\tfloat f4 = traceQuad(ro, rd, bp, size.xz, rt * rotx(PI2), -piv.wwy);\n    float f5 = traceQuad(ro, rd, bp, size.xz, rt * rotx(PI2), piv.wwy);\n        \n    float m = pmin(f0, f1); m = pmin(m, f2); m = pmin(m, f3); m = pmin(m, f4); m = pmin(m, f5);\n    if (m < 0.0) return vec2(m);\n    \n    vec2 ret = vec2(m, 1.0);\n    if (f0 > 0. && f0 != ret.x) ret.y = f0;\n    else if (f1 > 0. && f1 != ret.x) ret.y = f1;\n    else if (f2 > 0. && f2 != ret.x) ret.y = f2;\n    else if (f3 > 0. && f3 != ret.x) ret.y = f3;\n    else if (f4 > 0. && f4 != ret.x) ret.y = f4;\n    else if (f5 > 0. && f5 != ret.x) ret.y = f5;\n        \n    return ret;\n}\n\n// repeats space angularly.\nvec2 repeatPolarAngle(in vec2 ar, float angle)\n{\t\n    ar.x = mod(ar.x, angle);\n    vec2 p = vec2(cos(ar.x), sin(ar.x)) * ar.y;\n    return p;\n}\n\n// to polar coordinates\nvec2 polar(in vec2 p)\n{\n    return vec2(atan(p.y, p.x), length(p));\n}\n\n// ship shape slices\nconst float slice = PI * 0.15;\n\nvec2 g_rp_polar = vec2(0.0);\nvec3 g_shipPos = vec3(0.0);\nmat3 g_shipRotation = mat3(1.0);\nvec3 g_hitp_local = vec3(0.0);\nmat3 g_model_correction = mat3(1.0);\nvec2 g_uv = vec2(0.0);\nvec3 lightDir = normalize(vec3(.0, 15.0, -2.0));\nfloat g_camT = 0.0; \nfloat g_shipT = 0.0;\nvec3 g_hitp = vec3(0.0);\n\n////////////////\n// ship model\n// basicly a box in a space that's repeated by angle\n//////////////////\nfloat map(in vec3 _rp)\n{\n    _rp -= g_shipPos;\n    _rp = _rp * g_shipRotation;\n    _rp = _rp * g_model_correction;\n    g_rp_polar = polar(_rp.xz);\n    g_hitp_local = _rp;\n    \n    // ship shape is made by repeating the space in pie-shape fashion\n    vec2 rp_polar_real = polar(_rp.xz);\n\tvec2 rp_polar = abs(rp_polar_real);\n    \n    _rp.xz = repeatPolarAngle(rp_polar, slice);\n    \n    float m = sdBox( _rp, vec3(0.05, 0.0035, 0.05) * 4.0);\n    float m3 = sdBox((_rp + vec3(-0.15, -0.015, 0.)), vec3(0.005, 0.015, 0.012) * vec3(6.0, 4.0, 10.0));\n    \n    // 2 boxes mixed gives nicer shape\n\tm = mix(m, m3, 0.1);\n    // mixing with a sphere for a rounded shape\n    m = mix(m, length(_rp - vec3(0.0, 0.05, 0.)) - .2, 0.2);\n\treturn m;\n}\n\n// gradient\nvec3 grad(in vec3 rp, float sharpness)\n{\n    vec2 off = vec2(sharpness, 0.0);\n    vec3 g = vec3(map(rp + off.xyy) - map(rp - off.xyy),\n                  map(rp + off.yxy) - map(rp - off.yxy),\n                  map(rp + off.yyx) - map(rp - off.yyx));\n    return normalize(g);\n}\n\n\nfloat g_rayExitDistance; // distance for exitting the bounding box of ship\n\n// a bit hacky function to get the shading that I wanted.\nfloat lobe(float d, float wrap)\n{\n    d = d + wrap / (1.0 + wrap);\n    d /= sqrt(d);\n    return d;\n}\n\nbool traceShip(in vec3 ro, in vec3 rp, in vec3 rd, inout vec4 outColor)\n{\n    bool hit = false;\n    rp += rd * .3;\n    float dist = 0.0;\n    float fi = 0.0;\n    float closest = 999.0;\n    vec3 closestPos = vec3(0.0);\n    \n    for (int i = 0; i < 25; ++i)\n    {\n        fi = float(i);\n        dist = map(rp);\n        if (dist < closest)\n        {\n           closest = dist;\n           closestPos = rp;\n        }\n        \n        if(dist <= 0.00)\n        {\n            hit = true;\n            break;\n        }\n        rp += rd * max(dist * .85, 0.005);\n        float l = length(ro - rp);\n        if (l > g_rayExitDistance) break;\n    }\n    \n    // anti-aliasing the outer edges.\n    float AA = dFdx(g_uv.x) * 2.;\n    \n    // early out if not close enough to edge\n    if(closest > AA) { return false; }\n    \n    // few iterations for better quality if surface was penetrated a lot.\n    for (int i = 0; i < 3; ++i)\n    {\n        rp += sign(dist) * max(abs(dist), 0.00001) * rd;\n        dist = map(rp);\n    }\n    \n    hit = hit || dist < 0.0;\n    float rayLength = length(ro - rp);\n    \n    \n    \n    if(!hit) rp = closestPos;\n    \n    // depth test\n\tif (outColor.a < rayLength) return false;\n    ////////////////////////////////////////////////\n    //////////// UFO texturing and shading  ///////\n    ///////////////////////////////////////////////\n    \n    float X = (PI * 0.05 + PI + g_rp_polar.x) / (2.0 * PI);\n    float b = PI / slice * 4.0;\n    X = floor(X * b);\n    bool glass = false;\n    \n    vec4 albedo = (vec4(100,200,250, 0.0) / 256.0) * 0.9;\n\n    vec4 color = vec4(0.0);\n\tfloat roughness = 0.15;\n    float worness = 3.0;\n    float refl = 0.05;\n    \n    if (g_hitp_local.y > 0.0 && g_hitp_local.y < 0.025 && (X == 0.0 || X == 1.0 || X == 27.0 || X == 26.0))\n    {\n        albedo.rgb = vec3(.9, .9, .9);\n        glass = true;\n    }\n    \n       \n    vec3 yellow = vec3(.7, 0.2, 0.0);        \n    if (g_hitp_local.y <= -0.01) albedo.rgb = vec3(.1, .1, .0);\n    \n    else if (g_hitp_local.y <= 0.006) albedo.rgb = yellow;\n    else if (abs(g_rp_polar.x - 2.8) <= 0.02) albedo.rgb = yellow;\n    else if (abs(g_rp_polar.x + 2.8) <= 0.02) albedo.rgb = yellow;\n    else if (abs(g_rp_polar.x - .42) <= 0.08) albedo.rgb = yellow;\n    else if (abs(g_rp_polar.x + .42) <= 0.08) albedo.rgb = yellow;\n    else if (abs(g_rp_polar.x + .0) <= 0.08)  albedo.rgb = yellow;\n\n    bool engine = (X >= 12.0 && X <= 15.0);\n    if (g_hitp_local.y > -0.01 && g_hitp_local.y < 0.005 && engine)\n    {\n        color.rgb += (vec3(.5) + 0.35 * sin(abs(g_shipT * getShipRoll(g_shipT) * .03) )) ;\n    }\n\n    vec3 g = grad(rp, 0.0025);\n    \n    // Bump\n    if(!glass)\n    {\n        vec2 bmpUv = g_hitp_local.xz;\n        \n        vec3 bump = roughness * texture(iChannel2, bmpUv * 5.5).rgb;\n        \n        float bm = 75.0;\n        float damage = sin(bmpUv.y * bm * 0.6) * sin(bmpUv.x * bm) * 0.5;\n        damage += sin(bmpUv.y * bm * 0.3) * sin(bmpUv.x * bm * 0.3);\n        \n        damage = clamp(damage, 0.0, 1.0);\n        roughness += worness * roughness * damage;\n        bump += roughness * texture(iChannel2, g_hitp_local.yz * 5.5).rgb;\n        albedo = mix(albedo, vec4(0.6, 0.2, 0.0, .0), roughness * .8);\n        g = g + bump * 1.;\n        g = normalize(g);\n    }\n\n    float d = dot(g, lightDir);\n    d = clamp(d, 0.0, 1.0);\n    d = lobe(d, 0.1);\n    color += albedo * d;\n\t\n    // spec\n    float sp = glass ? 13.0 : 80.0;\n    vec3 H = normalize(-rd + lightDir);\n    float Sd = dot(H, g);\n    Sd = clamp(Sd, 0.001, 1.0);\n    Sd = lobe(Sd, 0.);\n    Sd = pow(Sd, sp) * .2;\n\t\n    vec3 envColor = texture(iChannel3, reflect(rd, g)).rgb;\n    color.rgb += glass ? 0.7 * envColor : envColor * max(0.0, (1.0 - roughness)) * refl;\n    \n    // fres\n    float SCL = 4.; \n    float PWR = 10.0;\n    \n    float Fd = dot(rd, g);\n    Fd = min(1.0, 1.0 + Fd) * 0.5;\n    Fd = lobe(Fd, 0.25);\n    \n    float F = SCL * pow(Fd, PWR);\n    vec3 FCol = vec3(0.2, 0.12, 0.04);\n\tcolor.rgb = mix(color.rgb, FCol, min(F, 1.0) );\n    color += vec4(Sd);\n    \n    float colMix = smoothstep(AA, 0.0, closest);\n    \n    float sh = shadowEnv(rp, vec3(0.0, .2, 0.0), lightDir);\n   \tcolor.rgb *= mix(1.0, sh, 0.75);\n    outColor = mix(outColor, color, colMix);\n    outColor.a = rayLength;\n    g_hitp = rp;\n    \n    return hit;\n}\n\n\n// \nbool doShip(in vec3 rp, in vec3 rd, inout vec4 color)\n{\n    vec3 ro = rp;\n    vec2 hitBox = traceBox(ro, rd, g_shipPos + vec3(0.0, 0.01, 0.0), vec3(0.24, 0.05, 0.21), g_shipRotation);\n    if (hitBox.x <= 0.) return false;\n    \n    // bug fix to where 2 seams meet\n    g_rayExitDistance = max (hitBox.y, 2.5);\n    \n    bool hit = traceShip(ro, rp, rd, color);\n    //if(hit) color += vec4(0.1);\n    return hit;\n}\n\n/////////////////////////////////////\n///////// ENVIRONMENT ///////////////\n//////////////////////////////////////\nfloat ENV_P = 0.05; // scale for fbm texture uv\nfloat ENV_B = .3; // multiplier for strength of fbm\nvec3 bgFadeCol = vec3(1.2, .95, .6) * 0.45;\n\n// clouds\nfloat fbmHI (in vec2 uv)\n{\n\tfloat f = texture(iChannel2, uv).r * 0.5;    \n\tf += texture(iChannel2, uv * 2.0).r * 0.25;    \n\tf += texture(iChannel2, uv * 4.0).r * 0.25 * 0.5;\n\tf += texture(iChannel2, uv * 8.0).r * 0.25 * 0.5 * 0.5;\n\tf += texture(iChannel2, uv * 16.0).r * 0.25 * 0.5 * 0.5 * 0.5;\n    return f;\n}\n\n// walls\nfloat fbm (in vec2 uv)\n{\n\tfloat f = texture(iChannel2, uv).r * 0.75;    \n\tf += texture(iChannel2, uv * 7.0).r * 0.25 * 0.5;\n    return f;\n}\n\n// walls\nfloat fbmLO (in vec2 uv)\n{\n\tfloat f = texture(iChannel2, uv).r * 0.75;    \n    return f;\n}\n\nfloat g_fbm;\nvec3 _mapRP;\n\n// path curving\nfloat getPathOffset(float x)\n{\n    float offset =  sin(x * 0.1) * 2.0 + sin(x * 0.05) * 3. + cos(x * 0.2) * 1.0;\n    return offset * 1.7;\n}\n\nfloat getMapHeight(float x)\n{\n    return 0.5 + (sin(x * 0.05 + sin(x * 0.3))) * 0.5;\n}\n\n// vertical layer size\nconst float layerSize = .95;\n\n// valley width\nfloat valleyWidth = 7.;\nfloat g_shadowSharpness = 0.16;\n\nfloat _mapEnv(in vec3 rp)\n{\n    rp.z += getPathOffset(rp.x);\n    float sgnZ = rp.z > 0.0 ? 1.0 : -1.0;\n    \n    float sx2 = sin(rp.x * 0.25);\n    float sx3 = sin(rp.x * 0.0125);\n    ///////////////\n    // tilt of valley\n    float tilt = (-.2 + smoothstep(-.5, .5, sx3)); \n    g_shadowSharpness = clamp(tilt, 0.025, 0.26); // hack to get shadows look good\n    // curves on layers\n    float c = sx3 + sx2 * 0.5 + sin(rp.x) * sgnZ * 0.15;\n    rp.y += c;\n    // layers\n    float fy = fract(rp.y / layerSize);\n    float l =  floor(rp.y / layerSize) * tilt + smoothstep( 0.0, 0.85, fy) * tilt;\n    rp.z = min(0.0, -abs(rp.z) - valleyWidth + l);\n    \n    // negative space inside\n    float m = 0.006 * dot(rp.zy, rp.zy) - .5;\n    m = max(-m, sdBox(_mapRP, vec3(10000.0, -c + 5., 10000.0)));\n    m = smin(m, sdBox(_mapRP + vec3(0.0, 1.0, 0.0),vec3(20000.0, 1.0, 20000.0)), .2);\n\treturn m;        \n}\n\n\nfloat groundDetail(in vec3 rp)\n{\n   float F = fbmLO(rp.xz * .01);\n   float amount = 0.25 + sin(rp.x * 0.05) * 0.2;\n   F = smoothstep(amount, amount + .08, F);\n   return smoothstep(.2, 0.0, rp.y) * F;\n}\n\nfloat mapEnvLO(in vec3 rp)\n{\n    _mapRP = rp + getMapHeight(rp.x);\n    g_fbm = fbmLO (abs(rp.xz) * ENV_P) * ENV_B;\n    float d = groundDetail(_mapRP);\n    rp.xy += g_fbm;\n\t\n    return _mapEnv(rp);\n}\n\n\nfloat mapEnv(in vec3 rp)\n{\n    _mapRP = rp + getMapHeight(rp.x);\n    g_fbm = fbm  (abs(rp.xz) * ENV_P) * ENV_B;\n    \n    float d = groundDetail(_mapRP);\n    _mapRP.y += d * .35 * g_fbm;\n    rp.xy += g_fbm;\n    return _mapEnv(rp);\n}\n\n// environment gradient\nvec3 gradEnv(in vec3 rp, float sharpness)\n{\n    vec2 off = vec2(sharpness, 0.0);\n    vec3 g = vec3(mapEnv(rp + off.xyy) - mapEnv(rp - off.xyy),\n                  mapEnv(rp + off.yxy) - mapEnv(rp - off.yxy),\n                  mapEnv(rp + off.yyx) - mapEnv(rp - off.yyx));\n    return normalize(g);\n}\n\nvec4 tex3D( sampler2D tex, in vec3 p, in vec3 n )\n{\n    vec4 c1 = texture(tex, p.xy);\n    vec4 c2 = texture(tex, p.yz);\n    vec4 c3 = texture(tex, p.xz);\n    \n    vec4 color = abs(dot(n, vec3(0.0, 0.0, 1.0))) * c1;\n    color += abs(dot(n, \tvec3(1.0, 0.0, 0.0))) * c2;\n    color += abs(dot(n, \tvec3(0.0, 1.0, 0.0))) * c3;\n    return clamp(color, 0.0, 1.0);\n}\n\n\n// tint on the ground texture\nvec4 groundTint = vec4(0.35, 0.25, 0.1, 0.0) * 3.0;\n\n// shadows and occlusion\nfloat shadowEnv (in vec3 rp, in vec3 g, in vec3 ld)\n{\n\trp += g * 0.03;\n    const int stps = 10;\n\n    float s = 1.0;\n    float occ = 0.0;\n    for (int i = 1; i < stps; ++i)\n    {\n        float stp = .015 * float(i * i);\n\t    rp += ld * stp;\n        float d = mapEnv(rp);\n        occ += clamp(d/stp, .0, 1.0) * (1./float(i));\n        s = min(s, clamp(mapEnv(rp) / stp, 0.0, 1.0));\n    }\n    occ /= 2.0;\n    \n    s = smoothstep(0.0, g_shadowSharpness, s);\n    s = min(s, occ);\n\treturn min(s, 1.);\n}\n\nfloat getCurvature(in vec3 rp, in vec3 g)\n{\n   vec3 gw = fwidth(g);\n   vec3 pw = fwidth(rp);\n   float wfcurvature = length(gw) / length(pw);\n   return smoothstep(0.0, 12., wfcurvature);        \n}\n\nvec3 g_groundHitp = vec3(0.0);\n\nbool doEnv(in vec3 rp, in vec3 rd, inout vec4 color)\n{\n    vec3 ro = rp;\n    float dist = 0.0;\n    bool hit = false;\n    float closest = 999.0;\n    vec3 closestPos = vec3(0.0);\n    float AA = 1.0 * dFdx(g_uv).x;\n    float travelled = 0.0;\n    \n    for (int i = 0; i < 45; ++i)\n    {\n        dist = mapEnvLO(rp);\n        if (dist < closest)\n        {\n            closest = dist;\n            closestPos = rp;\n        }\n        \n        if (dist < 0.0)\n        {\n            hit = true;\n            break;\n        }\n        float lg2 = log2(1.0 + travelled * 15.0);\n        float stp = max(0.01 * lg2, dist * (.9 + lg2));\n        rp += rd * stp;\n        travelled += stp;\n        \n        if (travelled > 150.0)\n        {\n            break;\n    \t}\n    }\n    \n    // detail steps\n    for (int i = 0; i < 35; ++i)\n    {\n        float D = dist * 0.5 * log2(1.0 + travelled);\n        travelled += D;\n        \n        rp += sign(D) * max(abs(D), 0.001) * rd;\n        dist = mapEnv(rp);\n        hit = hit;// || hitDetail;\n    }\n    \n    closestPos = rp;\n    AA *= travelled * 30.0;\n\tAA = smoothstep(AA, .0, closest);\n    \n    float depth = travelled;\n    hit = hit || AA > .0;\n    \n    if (depth < color.a)\n    {\n        rp = closestPos;\n        g_groundHitp = ro + rd * depth;    \n        \n        if (hit)\n        {\n\t        color.a = depth;\n        }\n        vec3 g = gradEnv(closestPos, 0.05);\n        vec3 tc = (tex3D(iChannel1, closestPos * 0.15, g) * groundTint).rgb;\n        float luma = dot ( vec3(0.2126,0.7152, 0.0722), vec3(fbm(closestPos.xz * 2.1)));\n        float m = groundDetail(closestPos);\n        \n\t\tfloat texLuma = dot ( vec3(0.2126,0.7152, 0.0722), tc); \n        vec3 sand = mix(tc, mix(1., luma, 0.3) * vec3(1., .7, .4), m);\n        tc = mix(tc, sand, .5);\n        \n        //////////////////////\n        // some curvature details (ice)\n        float c1 = getCurvature(closestPos, g);\n        vec3 p2 = closestPos + vec3(.05, .0, .0);\n        vec3 g2 = gradEnv(p2, .05);\n        float c2 = getCurvature(p2, g2);\n        float curvature = 0.35 * (c1 + c2);\n\t\t\n        tc = mix(tc, vec3(1.0), smoothstep(2., .0, rp.y) * curvature);\n        float sh = shadowEnv(rp, g2, lightDir);\n        tc *= mix(1.0, sh, 0.81);\n        \n        float d = dot(g, lightDir);\n        d = clamp(d, 0.01, 1.0);\n        d = lobe(d, 0.4);\n        \n        color.rgb = mix(color.rgb, tc * d, AA);\n        \n    }\n    \n    g_hitp = rp;\n\treturn hit;  \n}\n\nmat3 lookat(vec3 from, vec3 to)\n{\n    vec3 f = normalize(to - from);\n    vec3 _tmpr = normalize(cross(f, vec3(0.0, .999, 0.0)));\n    vec3 u = normalize(cross(_tmpr, f));\n    vec3 r = normalize(cross(u, f));\n    return mat3(r, u, f);\n}\n///////////////////////////////////////////////\n////////   Ship and camera orientation   //////\n///////////////////////////////////////////////\nvec3 getCamDirection(float T);\nvec3 getCamPos(float T);\n\nvec3 getShipPos(float T, float o)\n{\n    g_shipT = o + T + 1.5;\n    vec3 cp =  vec3(g_shipT, .6 + sin(g_shipT*.15) * 0.2, .0);\n    cp.z -= getPathOffset(g_shipT);\n    return cp;\n}\n\nvec3 getShipVelocity(float T)\n{\n    vec3 p1 = getShipPos(T, .0);\n\tvec3 p2 = getShipPos(T, 1.0);\n\treturn (p2 - p1);\n}\nvec3 getShipDirection(float T)\n{\n    return normalize(getShipVelocity(T));\n}\n\nfloat getShipRoll(float T)\n{\n    vec3 dirAtT = getShipDirection(T + 1.5);\n    float roll = (cross(dirAtT, getShipDirection(T + .0))).y * 10.0;\n    return clamp(roll, -PI2, PI2);\n}\n\nmat3 getShipRotation(float T)\n{\n    vec3 dirAtT = getShipDirection(T + 1.5);\n    mat3 fw = lookat(vec3(0.0), dirAtT);\n    return fw * rotz(-getShipRoll(T));\n}\n\nbool g_camStill = false;\nconst float SEQ_LENGTH = 250.0;\nconst float CAM_DRIVE_TIME = 50.0;\n\nvoid checkCamStill(float T)\n{\n    g_camStill = mod(T, SEQ_LENGTH) < CAM_DRIVE_TIME;\n}\n\nfloat getCamCurvature(float T)\n{\n    vec3 dirAtT = getCamDirection(T);\n    mat3 fw = lookat(vec3(0.0), dirAtT);\n    return (cross(dirAtT, getCamDirection(T - 1.1))).y;\n}\n\n\nvec3 getCamPos(float T)\n{\n    if (g_camStill) T = floor(T / SEQ_LENGTH) * SEQ_LENGTH + CAM_DRIVE_TIME / 2.0;\n    float y =  .5 + (.3 * sin(T * 0.05));\n\tvec3 cp = vec3(0.0);\n    if (g_camStill) \n    {\n    \tcp =  vec3(T, y - .15, .1);\n    }\n    else\n    {\n    \tcp =  vec3(T,y, .0);\n\t\tcp.x += sin(T * 0.05) * .5;\n    }\n   \tcp.z -= getPathOffset(cp.x);\n\treturn cp;    \n}\n\nvec3 getCamDirection(float T)\n{\n    \n    vec3 p1 = getCamPos(T - 2.);\n    if(g_camStill) p1 = getCamPos(T);\n    \n    vec3 p2 = getShipPos(T, 0.0);\n    return normalize(p2 - p1);\n}\n\nmat3 getCamRotation(float T)\n{\n    mat3 fw = lookat(vec3(0.0), getCamDirection(T));\n    float roll = getCamCurvature(T) * 8.0;\n    roll = clamp(roll, -PI2, PI2);\n    if(g_camStill) roll = 0.0;\n    return fw * rotz(-roll);\n}\n\nvoid doSky(in vec3 ro, in vec3 rd, inout vec3 col)\n{\n\n    float skyH = 120.0;\n    float dif = skyH - ro.y;\n    float cloudSpeed = iTime * 0.01;\n    vec3 rp = ro + (rd * dif * (1.0 / rd.y));\n    vec2 uv = vec2(rp.xz * 0.0001);\n    float f = fbmHI(cloudSpeed * vec2(1.0, 0.0) + uv);\n    f = smoothstep(0.0, 0.8, f);\n    \n    float f2 = fbmHI(cloudSpeed * vec2(1.0, 0.4) + uv * 2.0);\n    f = mix(f, f2, 0.5);\n    col = mix(col, vec3(f - smoothstep(1., 2.5, f + f2)), f);\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    \n    g_camT = 100.0 + mod(iTime, 900.0) * 10.0;\n    checkCamStill(g_camT);\n    \n    g_shipRotation = getShipRotation(g_camT);\n    g_model_correction = roty(-PI2);\n\t\n    vec2 uv = fragCoord.xy / iResolution.xy;\n    uv -= vec2(0.5);\n    uv.y /= iResolution.x / iResolution.y;\n\tg_uv = uv;\n    vec2 im = 2.0 * ((iMouse.xy / iResolution.xy) - vec2(0.5));\n    \n    /////////////\n    /// Camera\n    //////////////\n    vec3 rp = getCamPos(g_camT);\n    g_shipPos = getShipPos(g_camT, 0.0);\n\n\tvec3 rd = normalize(vec3(uv, .4));\n    mat3 lkAtMat = getCamRotation(g_camT);\n    \n    rd = normalize(lkAtMat * rd);    \n    fragColor.rgb = vec3(0.0);\n\tfragColor.a = 9999.0;\n    ///////////////////////////\n    /// BG mountains + sky  ///\n    ///////////////////////////\n\n    vec3 depthFade = mix(fragColor.rgb, bgFadeCol, min(1.0, pow(fragColor.a * 0.02, 1.)));\n    fragColor.rgb = depthFade;\n    \n    // sky colors and mountains\n    if (rd.y > 0.0)\n    {\n\t    vec2 polar = vec2(PI + atan(rd.z, rd.x), 1.0);\n    \tfloat H = sin(polar.x * 20.0) * 0.2;\n    \tH += sin(polar.x * 1.0) * 0.4;\n    \tH += sin(polar.x * 5.0) * 2.0;\n    \tH += sin(polar.x * .4) * 0.25;\n        \n\t    vec3 grp = rp + rd * 1000.0;\n\t    float mTop = -25.0;\n    \tfloat mFade = smoothstep(0.0, 5000. * dFdx(g_uv).x, (grp.y + mTop) - H * 10.0);\n        fragColor.rgb = (1.0 - vec3(mFade)) * bgFadeCol;\n        vec3 skyBottom = vec3(.5, .6, .8) * 2.;\n        vec3 skyTop = vec3(0.2, 0.3, 0.7) * 2.1;\n        fragColor.rgb += mix(skyBottom, skyTop, smoothstep(0.0, 0.6, rd.y)) * mFade;\n    }\n    \n\t// Environment\n    bool env = doEnv(rp, rd, fragColor);\n    // Ship    \n    bool shipHit = doShip(rp, rd, fragColor);\n    \n    // ship shadow\n    if (!shipHit)\n    {\n        vec3 dif = (g_shipPos - g_groundHitp);\n        float d = dot(normalize(dif), vec3(0.0, 1.0, 0.0));\n        d = clamp(d, 0.0, 1.0);\n        float x = pow(length(dif * 20.), .7) * (1.0 - d);\n        x = clamp(x, 0.0, 1.0);\n        fragColor.rgb = mix(fragColor.rgb, x * fragColor.rgb, 0.5);\n    }\n    \n    \n    // clouds\n    if(!env && !shipHit && rd.y > 0.0)\n    {\n        doSky(rp, rd, fragColor.rgb);\n    }\n\n    ////////////////////////////\n    // data for motion blur   //\n    /////////////////////////////\n    \n\t// the pixel at (0, 0) reads previous frame ray direction from pixel (1, 0) \n    // pixel at (1, 0) stores ray direction with \"time stamp\"\n    float tStamp = mod(float(iFrame), 100.0);\n    if(fragCoord.y < 1.0)\n    {\n        if(fragCoord.x < 1.0)\n        {\n            // check value from pixel next to this\n\t        vec4 stored = texture(iChannel0, vec2(1.5, 0.5) / iChannelResolution[0].xy, -100.0 );\n            if (stored.a != tStamp)\n            {\n                // store value if it's older than current frame to this pixel\n                fragColor = stored;\n            }\n        }\n        else if (fragCoord.x < 2.0)\n        {\n\t        fragColor.rgb = vec3(0.0, 0.0, 1.0) * lkAtMat;\n            fragColor.a = tStamp;\n        }\n        // camera matrix information\n        else if (fragCoord.x < 3.0) fragColor.rgb = lkAtMat[0];\n        else if (fragCoord.x < 4.0) fragColor.rgb = lkAtMat[1];\n        else if (fragCoord.x < 5.0) fragColor.rgb = lkAtMat[2];\n        \n    }\n}",
            "name": "Buffer A",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "XsXGR8"
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
            "code": "vec4 getTexColor(vec2 uv)\n{\n    return texture(iChannel0, uv);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    \n    vec2 uv = fragCoord.xy/iResolution.xy;\n\n    vec4 texColor = getTexColor(uv);\n    \n    vec3 prevCamD = texture(iChannel0, vec2(0.5, 0.5) / iChannelResolution[0].xy, -100.0 ).rgb;\n\n    mat3 lkAt;\n    lkAt[0] = texture(iChannel0, vec2(2.5, 0.5) / iChannelResolution[0].xy, -100.0 ).rgb;\n    lkAt[1] = texture(iChannel0, vec2(3.5, 0.5) / iChannelResolution[0].xy, -100.0 ).rgb;\n    lkAt[2] = texture(iChannel0, vec2(4.5, 0.5) / iChannelResolution[0].xy, -100.0 ).rgb;\n    \n    float stpX = (1.0 / iResolution.x);\n    float stpY = (1.0 / iResolution.y);\n    \n    vec3 dif = prevCamD * transpose(lkAt);\n    dif.x *= -1.0;\n    dif *= log2(1.0 + dot(dif, dif) * 1000.0);\n    vec3 color = texColor.rgb * 1.0;\n    \n    const int stps = 10;\n    float dist = max( (log2(1.0 + texColor.a * 200.0) ) - 4.0, 0.0);\n    float depth = min( dist, 250.0);\n    float ld = length(dif);\n    \n    float w = 1.0;\n    for (int i = 1; i < stps; ++i)\n    {\n        vec2 _uv = uv - dif.xy * depth * float(i) * fwidth(uv) * .35;\n        \n        if (_uv.x >= 0.0 && _uv.x <= 1.0 && _uv.y >= 0.0 && _uv.y <= 1.0)\n        {\n            float wt = 1.0 / (float(i) + 1.);\n            w += wt;\n\t        color += getTexColor(_uv).rgb * wt;\n        }\n    }\n    \n    color /= w;\n    fragColor.rgb = color;\n}",
            "name": "Buffer B",
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
          "id": "MlKGWK",
          "date": "1477948808",
          "viewed": 17897,
          "name": "ValleyRace",
          "username": "kuvkar",
          "description": "Star-wars inspired valley racing scene. There's still some aliasing I might fix but I don't think it's too bad. ",
          "likes": 138,
          "published": 3,
          "flags": 32,
          "usePreview": 0,
          "tags": [
            "ufo",
            "valley"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);