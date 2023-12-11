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
                "id": "XsBSR3",
                "filepath": "/media/a/cb49c003b454385aa9975733aff4571c62182ccdda480aaba9a8d250014f00ec.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "volume",
                "id": "4sfGRr",
                "filepath": "/media/a/27012b4eadd0c3ce12498b867058e4f717ce79e10a99568cca461682d84a4b04.bin",
                "sampler": {
                  "filter": "linear",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 2,
                "type": "texture",
                "id": "4sfGRn",
                "filepath": "/media/a/fb918796edc3d2221218db0811e240e72e340350008338b0c07a52bd353666a6.jpg",
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
                "type": "texture",
                "id": "XsX3Rn",
                "filepath": "/media/a/92d7758c402f0927011ca8d0a7e40251439fba3a1dac26f5b8b62026323501aa.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "\n// Hybrid SDF-Voxel Traversal - gelami\n// https://www.shadertoy.com/view/dtVSzw\n\n/* \n * Voxel traversal using a hybrid SDF-voxel method\n * \n * Traversal is done by doing raymarching/sphere tracing initially, switching\n * to voxel traversal when the distance is less than the bounding radius of the voxel\n * \n * Mouse drag to look around\n * Defines in Common\n * \n * This was much faster than octree traversal which I've done before\n * Around similar speeds with sphere tracing more or less depending on voxel size\n * \n * Other hybrid SDF-voxel traversal shaders:\n * \n * Twisted Eye (Voxelmarched) - Elyxian\n * https://www.shadertoy.com/view/ts23zy\n * \n * Moon voxels - nimitz\n * https://www.shadertoy.com/view/tdlSR8\n * \n */\n\n// Fork of \"Gelami Raymarching Template\" by gelami. https://shadertoy.com/view/mslGRs\n// 2023-05-31 08:11:32\n\nvec3 getCameraPos(float t)\n{\n    t += CAMERA_TIME_OFFSET;\n    return vec3(\n        (cos(t * 0.35 * CAMERA_SPEED) + sin(t * 0.25 * CAMERA_SPEED) * 0.5) * 0.55,\n        (sin(t * 0.25 * CAMERA_SPEED) + cos(t * 0.2 * CAMERA_SPEED) * 0.4) * 0.35,\n        t * CAMERA_SPEED);\n}\n\nfloat map(vec3 p)\n{\n    float d = MAX_DIST;\n    \n    float sc = 0.3;\n    \n    vec3 q = sc * p / iChannelResolution[1].xyz;\n    q -= vec3(0.003, -0.006, 0.0);\n    \n    d  = texture(iChannel1, q*1.0).r*0.5;\n    d += texture(iChannel1, q*2.0 + 0.3).r*0.25;\n    d += texture(iChannel1, q*4.0 + 0.7).r*0.125;\n    \n    float tp = smoothstep(50.0, -6.0, p.y);\n    tp = tp*tp;\n    \n    d = (d/0.875 - SURFACE_FACTOR) / sc;\n    \n    d = smax(d, p.y - MAX_HEIGHT, 0.6);\n    \n    float c = TUNNEL_RADIUS - length(p.xy - getCameraPos(p.z / CAMERA_SPEED - CAMERA_TIME_OFFSET).xy);\n    \n    d = smax(d, c, 0.75);\n    \n    return d;\n}\n\nvec3 grad(vec3 p)\n{\n    const vec2 e = vec2(0, 0.1);\n    return (map(p) - vec3(\n        map(p - e.yxx),\n        map(p - e.xyx),\n        map(p - e.xxy))) / e.y;\n}\n\nstruct HitInfo\n{\n    float t;\n    vec3 n;\n    vec3 id;\n    int i;\n};\n\nvec3 getVoxelPos(vec3 p, float s)\n{\n    return (floor(p / s) + 0.5) * s;\n}\n\nbool trace(vec3 ro, vec3 rd, out HitInfo hit, const float tmax)\n{\n    const float s = VOXEL_SIZE;\n    const float sd = s * sqrt(3.0);\n    \n    vec3 ird = 1.0 / rd;\n    vec3 iro = ro * ird;\n    vec3 srd = sign(ird);\n    vec3 ard = abs(ird);\n    \n    float t = 0.0;\n    \n    #ifdef SDF_TRAVERSAL\n    for (int i = 0; i < STEPS; i++)\n    {\n        vec3 pos = ro + rd * t;\n        float d = map(pos);\n        \n        if (d < EPS)\n        {\n            hit.t = t;\n            hit.id = pos;\n            hit.n = normalize(grad(pos));\n            hit.i = i;\n            return true;\n        }\n        \n        t += d;\n        \n        if (t >= tmax || (rd.y > 0.0 && pos.y > MAX_HEIGHT))\n            return false;\n    }\n    #else\n    \n    vec3 vpos = getVoxelPos(ro, s);\n    \n    bool voxel = false;\n    int vi = 0;\n    vec3 prd = vec3(0);\n    for (int i = 0; i < STEPS; i++)\n    {\n        vec3 pos = ro + rd * t;\n\n        float d = map(voxel ? vpos : pos);\n        \n        if (!voxel)\n        {\n            t += d;\n            \n            if (d < sd)\n            {\n                vpos = getVoxelPos(ro + rd * max(t - sd, 0.0), s);\n                voxel = true;\n                vi = 0;\n            }\n            \n        } else\n        {\n            vec3 n = (ro - vpos) * ird;\n            vec3 k = ard * s * 0.5;\n\n            vec3 t1 = -n - k;\n            vec3 t2 = -n + k;\n\n            float tF = min(min(t2.x, t2.y), t2.z);\n            //float tN = max(max(t1.x, t1.y), t1.z);\n            \n            #if 0\n            vec3 nrd = srd * step(t2, t2.yzx) * step(t2, t2.zxy);\n            #else\n            vec3 nrd = t2.x <= t2.y && t2.x <= t2.z ? vec3(srd.x,0,0) :\n                       t2.y <= t2.z ? vec3(0,srd.y,0) : vec3(0,0,srd.z);\n            #endif\n            \n            if (d < 0.0)\n            {\n                hit.t = t;\n                hit.id = vpos;\n                hit.n = -prd;\n                hit.i = i;\n                return true;\n            } else if (d > sd && vi > 2)\n            {\n                voxel = false;\n                t = tF + sd;\n                continue;\n            }\n            \n            vpos += nrd * s;\n            prd = nrd;\n            t = tF;\n            vi++;\n        }\n        \n        if (t >= tmax || (rd.y > 0.0 && pos.y > MAX_HEIGHT))\n            return false;\n    }\n    #endif\n\n    return false;\n}\n\nvec3 triplanar(sampler2D tex, vec3 p, vec3 n, const float k)\n{\n    n = pow(abs(n), vec3(k));\n    n /= dot(n, vec3(1));\n\n    vec3 col = texture(tex, p.yz).rgb * n.x;\n    col += texture(tex, p.xz).rgb * n.y;\n    col += texture(tex, p.xy).rgb * n.z;\n    \n    return col;\n}\n\nvec3 triplanarLod(sampler2D tex, vec3 p, vec3 n, const float k, float lod)\n{\n    n = pow(abs(n), vec3(k));\n    n /= dot(n, vec3(1));\n\n    vec3 col = textureLod(tex, p.yz, lod).rgb * n.x;\n    col += textureLod(tex, p.xz, lod).rgb * n.y;\n    col += textureLod(tex, p.xy, lod).rgb * n.z;\n    \n    return col;\n}\n\nconst vec3 lcol = vec3(1, 0.9, 0.75) * 2.0;\nconst vec3 ldir = normalize(vec3(0.85, 1.2, 0.8));\n\nconst vec3 skyCol = vec3(0.353, 0.611, 1);\nconst vec3 skyCol2 = vec3(0.8, 0.9, 1);\n\nvec2 getBiome(vec3 pos)\n{\n    float snow = textureLod(iChannel3, pos.xz * 0.00015, 0.0).r;\n    snow = smoothstep(0.695, 0.7, snow);\n    \n    float desert = textureLod(iChannel3, 0.55-pos.zx * 0.00008, 0.0).g;\n    desert = smoothstep(0.67, 0.672, desert);\n    \n    return vec2(desert, snow);\n}\n\nvec3 getAlbedo(vec3 vpos, vec3 gn, float lod)\n{\n    vec3 alb = 1.0-triplanarLod(iChannel2, vpos * 0.08, gn, 4.0, lod);\n    alb *= alb;\n    \n    vec3 alb2 = 1.0-triplanarLod(iChannel3, vpos * 0.08, gn, 4.0, lod);\n    alb2 *= alb2;\n    \n    float k = triplanarLod(iChannel0, vpos * 0.0005, gn, 4.0, 0.0).r;\n    k = smoothstep(0.3, 0.25, k);\n    \n    float wk = smoothstep(MAX_WATER_HEIGHT, MAX_WATER_HEIGHT + 0.5, vpos.y);\n    float top = smoothstep(0.3, 0.7, gn.y);\n    \n    alb = alb * 0.95 * vec3(1, 0.7, 0.65) + 0.05;\n    alb = mix(alb, alb2 * vec3(0.55, 1, 0.1), top * wk);\n    \n    alb = mix(alb, smoothstep(vec3(0.0), vec3(1.0), alb2), k * (1.0 - top));\n    \n    vec2 biome = getBiome(vpos);\n    \n    vec3 snow = alb2 * 0.8 + 0.2 * vec3(0.25, 0.5, 1);\n    snow = mix(snow, vec3(0.85, 0.95, 1), top * wk * 0.5);\n    \n    alb = mix(alb, saturate(vec3(1,0.95,0.9)-alb2*0.65), biome.x);\n    alb = mix(alb, snow * 2.0, biome.y);\n    \n    vec3 dcol = vec3(0.8, 0.55, 0.35);\n    dcol = mix(dcol, vec3(0.8, 0.65, 0.4), biome.x);\n    dcol = mix(dcol, vec3(0.2, 0.6, 0.8), biome.y);\n    \n    alb = mix(alb, alb * dcol, (1.0 - wk) * mix(1.0 - k, 1.0, max(biome.x, biome.y)));\n    \n    return alb;\n}\n\nvec3 shade(vec3 pos, vec3 ldir, float lod, HitInfo hit)\n{\n    vec3 vpos = hit.id;\n    \n    vec3 g = grad(vpos);\n    float gd = length(g);\n    vec3 gn = g / gd;\n    vec3 n = hit.n;\n    \n    float dif = max(dot(n, ldir), 0.0);\n    \n    if (dif > 0.0)\n    {\n        #ifdef SDF_TRAVERSAL\n        pos += hit.n * 0.05;\n        #else\n        pos += hit.n * 1e-3;\n        #endif\n        \n        HitInfo hitL;\n        bool isHitL = trace(pos, ldir, hitL, 12.0);\n\n        dif *= float(!isHitL);\n    }\n    \n    const float s = exp2(-4.0);\n    vec3 uvw = fract(pos / s);\n    vec2 vuv = abs(n.x) * uvw.yz + abs(n.y) * uvw.xz + abs(n.z) * uvw.xy;\n    \n    vec3 col = getAlbedo(vpos, gn, lod);\n    \n    float ao = smoothstep(-0.08, 0.04, map(pos) / length(grad(pos)));\n    float hao = smoothstep(WATER_HEIGHT - 12.0, WATER_HEIGHT, pos.y);\n    \n    #ifndef SDF_TRAVERSAL\n    col *= dot(abs(n), vec3(0.8, 1, 0.9));\n    #endif\n    \n    col *= (dif * 0.6 + 0.4) * lcol;\n    \n    col *= ao * 0.6 + 0.4;\n    col *= hao * 0.6 + 0.4;\n    \n    return col;\n}\n\nvec3 shade2(vec3 pos, vec3 ldir, float lod, HitInfo hit)\n{\n    vec3 vpos = hit.id;\n    \n    vec3 g = grad(vpos);\n    float gd = length(g);\n    vec3 gn = g / gd;\n    vec3 n = hit.n;\n    \n    float dif = max(dot(n, ldir), 0.0);\n    \n    const float s = exp2(-4.0);\n    vec3 uvw = fract(pos / s);\n    vec2 vuv = abs(n.x) * uvw.yz + abs(n.y) * uvw.xz + abs(n.z) * uvw.xy;\n    \n    vec3 col = getAlbedo(vpos, gn, lod);\n    \n    float ao = smoothstep(-0.08, 0.04, map(pos) / length(grad(pos)));\n    float hao = smoothstep(WATER_HEIGHT - 12.0, WATER_HEIGHT, pos.y);\n    \n    #ifndef SDF_TRAVERSAL\n    col *= dot(abs(n), vec3(0.8, 1, 0.9));\n    #endif\n    \n    col *= (dif * 0.6 + 0.4) * lcol;\n    \n    col *= ao * 0.6 + 0.4;\n    col *= hao * 0.6 + 0.4;\n    \n    return col;\n}\n\nvec3 getSky(vec3 rd)\n{\n    vec3 col = mix(skyCol2, skyCol, smoothstep(0.0, 0.2, rd.y)) * 1.2;\n    \n    #define SUN_ANGLE_DEGREES 0.52\n    const float sunAngle = SUN_ANGLE_DEGREES * PI / 180.0;\n    const float sunCost = cos(sunAngle);\n    \n    float cost = max(dot(rd, ldir), 0.0);\n    float dist = cost - sunCost;\n    \n    float bloom = max(1.0 / (0.02 - min(dist, 0.0)*500.0), 0.0) * 0.02;\n    \n    vec3 sun = 10.0 * lcol * (smoothstep(0.0, 0.0001, dist) + bloom);\n    \n    return col + sun;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 pv = (2. * (fragCoord) - iResolution.xy) / iResolution.y;\n    vec2 uv = fragCoord / iResolution.xy;\n    \n    const float fov = 80.0;\n    const float invTanFov = 1.0 / tan(radians(fov) * 0.5);\n    \n    #ifdef MOTION_BLUR\n    float mb = MOTION_BLUR * dot(pv, pv) / invTanFov * hash13(vec3(fragCoord, iFrame));\n    vec3 ro = getCameraPos(iTime + mb);\n    #else\n    vec3 ro = getCameraPos(iTime);\n    #endif\n    vec3 lo = vec3(0,0,-1);\n    \n    vec2 m = iMouse.xy / iResolution.xy;\n    \n    #ifdef STATIC_CAM\n    m = vec2(0.6, 0.45);\n    m = vec2(0.3, 0.42);\n    m = vec2(0.43, 0.48);\n    #endif\n    \n    float ax = -m.x * TAU + PI;\n    float ay = -m.y * PI + PI * 0.5;\n    \n    #ifdef STATIC_CAM\n    if (true)\n    #else\n    if (iMouse.z > 0.0)\n    #endif\n    {\n        lo.yz *= rot2D(ay);\n        lo.xz *= rot2D(ax);\n        lo += ro;\n    } else\n    {\n        #ifdef MOTION_BLUR\n        lo = getCameraPos(iTime + mb + 0.12);\n        #else\n        lo = getCameraPos(iTime + 0.12);\n        #endif\n    }\n\n    mat3 cmat = getCameraMatrix(ro, lo);\n\n    vec3 rd = normalize(cmat * vec3(pv, invTanFov));\n    \n    HitInfo hit;\n    bool isHit = trace(ro, rd, hit, MAX_DIST);\n    \n    float t = hit.t;\n    \n    vec3 pos = ro + rd * t;\n    vec3 vpos = hit.id;\n    \n    float lod = clamp(log2(distance(ro, vpos)) - 2.0, 0.0, 6.0);\n    \n    vec3 col = shade(pos, ldir, lod, hit);\n\n    const float a = 0.012;\n    const float b = 0.08;\n    float fog = (a / b) * exp(-(ro.y - WATER_HEIGHT) * b) * (1.0 - exp(-t * rd.y * b)) / rd.y;\n\n    vec2 biome = getBiome(vpos);\n\n    vec3 fogCol = vec3(0.5, 0.8, 1);\n    fogCol = mix(fogCol, vec3(1, 0.85, 0.6), biome.x);\n\n    col = mix(col, fogCol, fog);\n    \n    if (!isHit)\n    {\n        t = MAX_DIST;\n        col = getSky(rd);\n    }\n    \n    float pt = -(ro.y - WATER_HEIGHT) / rd.y;\n    \n    if (pt > 0.0 && pt < t || ro.y < WATER_HEIGHT)\n    {\n        if (!isHit)\n        {\n            col = fogCol;\n        }\n        \n        vec3 wcol = vec3(0.5, 1, 1);\n        wcol = mix(wcol, vec3(0.5,1,0.9), biome.x);\n        wcol = mix(wcol, vec3(0.2, 0.8, 1), biome.y);\n        \n        vec3 wabs = vec3(0.15,0.8,1);\n        \n        pt = ro.y < WATER_HEIGHT && pt < 0.0 ? MAX_DIST : pt;\n        \n        vec3 wpos = ro + rd * pt;\n        \n        const float e = 0.001;\n        const float wnstr = 1500.0;\n        \n        vec2 wo = vec2(1, 0.8) * iTime * 0.01;\n        vec2 wuv = wpos.xz * 0.08 + wo;\n        float wh = texture(iChannel2, wuv).r;\n        float whdx = texture(iChannel2, wuv + vec2(e, 0)).r;\n        float whdy = texture(iChannel2, wuv + vec2(0, e)).r;\n        \n        vec3 wn = normalize(vec3(wh - whdx, e * wnstr, wh - whdy));\n        \n        vec3 wref = reflect(rd, wn);\n        \n        vec3 rcol = vec3(0);\n        \n        if (ro.y > WATER_HEIGHT)\n        {\n            HitInfo hitR;\n            bool isHitR = trace(wpos + vec3(0, 0.01, 0), wref, hitR, 15.0);\n\n            rcol = isHitR ? shade2(wpos, ldir, lod, hitR) : getSky(wref);\n        }\n        \n        float spec = pow(max(dot(wref, ldir), 0.0), 50.0);\n        \n        const float r0 = 0.35;\n        float fre = r0 + (1.0 - r0) * pow(max(dot(rd, wn), 0.0), 5.0);\n        \n        if (rd.y < 0.0 && ro.y < WATER_HEIGHT)\n            fre = 0.0;\n        \n        float abt = ro.y < WATER_HEIGHT ? min(t, pt) : t - pt;\n        col *= exp(-abt * (1.0 - wabs) * 0.08);\n        \n        if (pt < t)\n        {\n        \n            col = mix(col, wcol * (rcol + spec), fre);\n        \n            vec3 wp = wpos + wn * vec3(1,0,1) * 0.2;\n            float wd = map(wp) / length(grad(wp));\n            float foam = sin((wd - iTime * 0.03) * 60.0);\n            foam = smoothstep(0.22, 0.0, wd + foam * 0.03 + (wh - 0.5) * 0.12);\n\n            col = mix(col, col + vec3(1), foam * 0.4);\n        }\n    }\n    \n    float cost = max(dot(rd, ldir), 0.0);\n    col += 0.12 * lcol * pow(cost, 6.0);\n    \n    #ifdef SHOW_NORMALS\n    col = hit.n;\n    #endif\n    \n    #ifdef SHOW_STEPS\n    col = turbo(float(hit.i) / float(STEPS));\n    \n    if (fragCoord.y < 10.0)\n        col = turbo(uv.x);\n    #endif\n    \n    col = max(col, vec3(0));\n    //col = col / (1.0 + col);\n    //col = ReinhardExtLuma(col, 5.0);\n    col = ACESFilm(col * 0.35);\n    \n    fragColor = vec4(linearTosRGB(col), 1);\n    fragColor += (dot(hash23(vec3(fragCoord, iTime)), vec2(1)) - 0.5) / 255.;\n}",
            "name": "Image",
            "description": "",
            "type": "image"
          },
          {
            "outputs": [],
            "inputs": [],
            "code": "\n#define MAX_HEIGHT 5.0\n\n#define MAX_WATER_HEIGHT -2.2\n#define WATER_HEIGHT MAX_WATER_HEIGHT\n// (MAX_WATER_HEIGHT * cos(iTime*0.01))\n\n#define TUNNEL_RADIUS 1.1\n    \n#define SURFACE_FACTOR 0.42\n\n#define CAMERA_SPEED -1.5\n#define CAMERA_TIME_OFFSET 0.0\n//9.32\n\n#define VOXEL_LEVEL 4\n#define VOXEL_SIZE exp2(-float(VOXEL_LEVEL))\n\n//#define SDF_TRAVERSAL\n\n//#define STATIC_CAM\n//#define SHOW_NORMALS\n//#define SHOW_STEPS\n\n//#define MOTION_BLUR 0.03\n\n#define STEPS 512\n#define MAX_DIST 60.0\n#define EPS 1e-4\n\n#define PI (acos(-1.))\n#define TAU (PI*2.)\n\nmat3 getCameraMatrix(vec3 ro, vec3 lo)\n{\n    vec3 cw = normalize(lo - ro);\n    vec3 cu = normalize(cross(cw, vec3(0, 1, 0)));\n    vec3 cv = cross(cu, cw);\n\n    return mat3(cu, cv, cw);\n}\n\nfloat safeacos(float x) { return acos(clamp(x, -1.0, 1.0)); }\n\nfloat saturate(float x) { return clamp(x, 0., 1.); }\nvec2 saturate(vec2 x) { return clamp(x, vec2(0), vec2(1)); }\nvec3 saturate(vec3 x) { return clamp(x, vec3(0), vec3(1)); }\n\nfloat sqr(float x) { return x*x; }\nvec2 sqr(vec2 x) { return x*x; }\nvec3 sqr(vec3 x) { return x*x; }\n\nfloat luminance(vec3 col) { return dot(col, vec3(0.2126729, 0.7151522, 0.0721750)); }\n\nmat2 rot2D(float a)\n{\n    float c = cos(a);\n    float s = sin(a);\n    return mat2(c, s, -s, c);\n}\n\n// https://iquilezles.org/articles/smin/\nfloat smin( float d1, float d2, float k ) {\n    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1.0 );\n    return mix( d2, d1, h ) - k*h*(1.0-h); }\n    \nfloat smax( float d1, float d2, float k ) {\n    float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1.0 );\n    return mix( d2, d1, h ) + k*h*(1.0-h); }\n\n\n// https://iquilezles.org/articles/palettes/\nvec3 palette(float t)\n{\n    return .5 + .5 * cos(TAU * (vec3(1, 1, 1) * t + vec3(0, .33, .67)));\n}\n\n// matplotlib colormaps + turbo - mattz\n// https://www.shadertoy.com/view/3lBXR3\nvec3 turbo(float t) {\n\n    const vec3 c0 = vec3(0.1140890109226559, 0.06288340699912215, 0.2248337216805064);\n    const vec3 c1 = vec3(6.716419496985708, 3.182286745507602, 7.571581586103393);\n    const vec3 c2 = vec3(-66.09402360453038, -4.9279827041226, -10.09439367561635);\n    const vec3 c3 = vec3(228.7660791526501, 25.04986699771073, -91.54105330182436);\n    const vec3 c4 = vec3(-334.8351565777451, -69.31749712757485, 288.5858850615712);\n    const vec3 c5 = vec3(218.7637218434795, 67.52150567819112, -305.2045772184957);\n    const vec3 c6 = vec3(-52.88903478218835, -21.54527364654712, 110.5174647748972);\n\n    return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));\n\n}\n\n// Hash without Sine\n// https://www.shadertoy.com/view/4djSRW\nfloat hash12(vec2 p)\n{\n\tvec3 p3  = fract(vec3(p.xyx) * .1031);\n    p3 += dot(p3, p3.yzx + 33.33);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\nfloat hash13(vec3 p3)\n{\n\tp3  = fract(p3 * .1031);\n    p3 += dot(p3, p3.zyx + 31.32);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\nvec2 hash22(vec2 p)\n{\n\tvec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yzx+33.33);\n    return fract((p3.xx+p3.yz)*p3.zy);\n}\n\nvec2 hash23(vec3 p3)\n{\n\tp3 = fract(p3 * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yzx+33.33);\n    return fract((p3.xx+p3.yz)*p3.zy);\n}\n\nvec3 hash33(vec3 p3)\n{\n\tp3 = fract(p3 * vec3(.1031, .1030, .0973));\n    p3 += dot(p3, p3.yxz+33.33);\n    return fract((p3.xxy + p3.yxx)*p3.zyx);\n}\n\nvec3 sRGBToLinear(vec3 col)\n{\n    return mix(pow((col + 0.055) / 1.055, vec3(2.4)), col / 12.92, lessThan(col, vec3(0.04045)));\n}\n\nvec3 linearTosRGB(vec3 col)\n{\n    return mix(1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055, col * 12.92, lessThan(col, vec3(0.0031308)));\n}\n\n// ACES tone mapping curve fit to go from HDR to LDR\n//https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/\nvec3 ACESFilm(vec3 x)\n{\n    float a = 2.51f;\n    float b = 0.03f;\n    float c = 2.43f;\n    float d = 0.59f;\n    float e = 0.14f;\n    return clamp((x*(a*x + b)) / (x*(c*x + d) + e), 0.0f, 1.0f);\n}\n\nvec3 ReinhardExtLuma(vec3 col, const float w)\n{\n    float l = luminance(col);\n    float n = l * (1.0 + l / (w * w));\n    float ln = n / (1.0 + l);\n    return col * ln / l;\n}\n",
            "name": "Common",
            "description": "",
            "type": "common"
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
          "id": "dtVSzw",
          "date": "1686577330",
          "viewed": 16229,
          "name": "Hybrid SDF-Voxel Traversal",
          "username": "gelami",
          "description": "Voxel traversal using a hybrid SDF-voxel method\n\nTraversal is done by doing raymarching/sphere tracing initially, switching\nto voxel traversal when the distance is less than the bounding radius of the voxel\n\nMouse drag to look around\nDefines in Common",
          "likes": 231,
          "published": 3,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "3d",
            "raytracing",
            "raymarching",
            "sdf",
            "voxel",
            "traversal"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);