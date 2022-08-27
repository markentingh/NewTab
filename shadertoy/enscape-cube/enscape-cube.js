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
                "id": "4sXGR8",
                "filepath": "/media/previz/buffer02.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// BufA: Main image\n// BufB: Bloom\n// BufC: TAA\n// Image: Post Processing\n\n// Main goal was to model a believable cloud scape and integrate\n// the floating Enscape cube in the scene with accurate reflection\n// and water interaction.\n// There are some compilation issues with Chrome on some machines,\n// Firefox seems to work better. The TAA only works well with high FPS.\n\n// Let me know what you think and follow me on Twitter @ThomasSchander\n// Regards to everyone around Karlsruhe :)\n\n//#define NO_POST_PRO\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 q = fragCoord.xy / iResolution.xy;\n    \n#ifdef NO_POST_PRO\n    fragColor = textureLod(iChannel0, q, 0.0);\n    return;\n#endif\n    vec2 v = -1.0 + 2.0*q;\n    v.x *= iResolution.x/ iResolution.y;\n    \n    float vign = smoothstep(4.0, 0.6, length(v));\n    \n    vec2 centerToUv = q-vec2(0.5);\n\tvec3 aberr;\n    aberr.x = textureLod(iChannel0, vec2(0.5)+centerToUv*0.995,0.0).x; \n    aberr.y = textureLod(iChannel0, vec2(0.5)+centerToUv*0.997, 0.0).y;\n    aberr.z = textureLod(iChannel0, vec2(0.5)+centerToUv, 0.0).z;\n    fragColor = vec4(pow(vign*aberr, vec3(0.2+1.0/2.2)), 1.0);\n}\n",
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
                "id": "4sf3Rr",
                "filepath": "/media/a/ad56fba948dfba9ae698198c109e71f118a54d209c0ea50d77ea546abad89c57.png",
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
              },
              {
                "channel": 2,
                "type": "volume",
                "id": "4sfGRr",
                "filepath": "/media/a/27012b4eadd0c3ce12498b867058e4f717ce79e10a99568cca461682d84a4b04.bin",
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
                "id": "4sf3Rn",
                "filepath": "/media/a/0a40562379b63dfb89227e6d172f39fdce9022cba76623f1054a2c83d6c0ba5d.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "#define VOLUME_TEXTURES\n//#define NOISE_TEXTURES\n\nconst float PI\t \t= 3.141592;\n#define EPSILON_NRM (0.1 / iResolution.x)\n\n// Cloud parameters\nconst float EARTH_RADIUS = 6300e3;\nconst float CLOUD_START = 800.0;\nconst float CLOUD_HEIGHT = 600.0;\nconst vec3 SUN_POWER = vec3(1.0,0.9,0.6) * 750.;\nconst vec3 LOW_SCATTER = vec3(1.0, 0.7, 0.5);\n\n// Ocean parameter\n// Procedural generation mostly from TDM https://www.shadertoy.com/view/Ms2SD1\nconst int ITER_GEOMETRY = 3;\nconst int ITER_FRAGMENT = 5;\nconst float SEA_HEIGHT = 0.6;\nconst float SEA_CHOPPY = 4.0;\nconst float SEA_FREQ = 0.16;\nconst vec3 SEA_BASE = 8.0*vec3(0.1,0.21,0.35);\n\n// Cube parameters\nconst vec3 albedo = vec3(0.95, 0.16, 0.015);\n\n// Noise generation functions (by iq)\nfloat hash( float n )\n{\n    return fract(sin(n)*43758.5453);\n}\n\nfloat hash( vec2 p ) {\n    return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);\n}\n\nfloat noise( in vec3 x )\n{\n    vec3 p = floor(x);\n    vec3 f = fract(x);\n    f = f*f*(3.0-2.0*f);\n#ifdef VOLUME_TEXTURES    \n    return textureLod(iChannel2, (p+f+0.5)/32.0, 0.0).x;\n#else\n\tvec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;\n\tvec2 rg = textureLod( iChannel1, (uv+0.5)/256.0, 0.0).yx;\n\treturn mix( rg.x, rg.y, f.z );\n#endif\n}\n\nfloat noise( in vec2 p ) {\n    vec2 i = floor( p );\n    vec2 f = fract( p );\t\n\tf = f*f*(3.0-2.0*f);\n#ifdef NOISE_TEXTURES\n    return textureLod(iChannel3, (i+f+vec2(0.5))/64.0, 0.0).x*2.0 -1.0;\n#else    \n    return -1.0+2.0*mix( mix( hash( i + vec2(0.0,0.0) ), \n                     hash( i + vec2(1.0,0.0) ), f.x),\n                mix( hash( i + vec2(0.0,1.0) ), \n                     hash( i + vec2(1.0,1.0) ), f.x), f.y);\n#endif\n}\n\nfloat fbm( vec3 p )\n{\n    mat3 m = mat3( 0.00,  0.80,  0.60,\n              -0.80,  0.36, -0.48,\n              -0.60, -0.48,  0.64 );    \n    float f;\n    f  = 0.5000*noise( p ); p = m*p*2.02;\n    f += 0.2500*noise( p ); p = m*p*2.03;\n    f += 0.1250*noise( p );\n    return f;\n}\n\nfloat intersectSphere(vec3 origin, vec3 dir, vec3 spherePos, float sphereRad)\n{\n\tvec3 oc = origin - spherePos;\n\tfloat b = 2.0 * dot(dir, oc);\n\tfloat c = dot(oc, oc) - sphereRad*sphereRad;\n\tfloat disc = b * b - 4.0 * c;\n\tif (disc < 0.0)\n\t\treturn -1.0;    \n    float q = (-b + ((b < 0.0) ? -sqrt(disc) : sqrt(disc))) / 2.0;\n\tfloat t0 = q;\n\tfloat t1 = c / q;\n\tif (t0 > t1) {\n\t\tfloat temp = t0;\n\t\tt0 = t1;\n\t\tt1 = temp;\n\t}\n\tif (t1 < 0.0)\n\t\treturn -1.0;\n    \n    return (t0 < 0.0) ? t1 : t0;\n}\n\nfloat clouds(vec3 p, out float cloudHeight, bool fast)\n{\n#if 1\n    float atmoHeight = length(p - vec3(0.0, -EARTH_RADIUS, 0.0)) - EARTH_RADIUS;\n    cloudHeight = clamp((atmoHeight-CLOUD_START)/(CLOUD_HEIGHT), 0.0, 1.0);\n    p.z += iTime*10.3;\n    float largeWeather = clamp((textureLod(iChannel0, -0.00005*p.zx, 0.0).x-0.18)*5.0, 0.0, 2.0);\n    p.x += iTime*8.3;\n    float weather = largeWeather*max(0.0, textureLod(iChannel0, 0.0002*p.zx, 0.0).x-0.28)/0.72;\n    weather *= smoothstep(0.0, 0.5, cloudHeight) * smoothstep(1.0, 0.5, cloudHeight);\n    float cloudShape = pow(weather, 0.3+1.5*smoothstep(0.2, 0.5, cloudHeight));\n    if(cloudShape <= 0.0)\n        return 0.0;    \n    p.x += iTime*12.3;\n\tfloat den= max(0.0, cloudShape-0.7*fbm(p*.01));\n    if(den <= 0.0)\n        return 0.0;\n    \n    if(fast)\n    \treturn largeWeather*0.2*min(1.0, 5.0*den);\n\n    p.y += iTime*15.2;\n    den= max(0.0, den-0.2*fbm(p*0.05));\n    return largeWeather*0.2*min(1.0, 5.0*den);\n#else\n    return 0.0;\n#endif\n}\n\n// From https://www.shadertoy.com/view/4sjBDG\nfloat numericalMieFit(float costh)\n{\n    // This function was optimized to minimize (delta*delta)/reference in order to capture\n    // the low intensity behavior.\n    float bestParams[10];\n    bestParams[0]=9.805233e-06;\n    bestParams[1]=-6.500000e+01;\n    bestParams[2]=-5.500000e+01;\n    bestParams[3]=8.194068e-01;\n    bestParams[4]=1.388198e-01;\n    bestParams[5]=-8.370334e+01;\n    bestParams[6]=7.810083e+00;\n    bestParams[7]=2.054747e-03;\n    bestParams[8]=2.600563e-02;\n    bestParams[9]=-4.552125e-12;\n    \n    float p1 = costh + bestParams[3];\n    vec4 expValues = exp(vec4(bestParams[1] *costh+bestParams[2], bestParams[5] *p1*p1, bestParams[6] *costh, bestParams[9] *costh));\n    vec4 expValWeight= vec4(bestParams[0], bestParams[4], bestParams[7], bestParams[8]);\n    return dot(expValues, expValWeight);\n}\n\nfloat lightRay(vec3 p, float phaseFunction, float dC, float mu, vec3 sun_direction, float cloudHeight, bool fast)\n{\n    int nbSampleLight = fast ? 7 : 20;\n\tfloat zMaxl         = 600.;\n    float stepL         = zMaxl/float(nbSampleLight);\n    \n    float lighRayDen = 0.0;    \n    p += sun_direction*stepL*hash(dot(p, vec3(12.256, 2.646, 6.356)) + iTime);\n    for(int j=0; j<nbSampleLight; j++)\n    {\n        float cloudHeight;\n        lighRayDen += clouds( p + sun_direction*float(j)*stepL, cloudHeight, fast);\n    }    \n    if(fast)\n    {\n        return (0.5*exp(-0.4*stepL*lighRayDen) + max(0.0, -mu*0.6+0.3)*exp(-0.02*stepL*lighRayDen))*phaseFunction;\n    }\n    float scatterAmount = mix(0.008, 1.0, smoothstep(0.96, 0.0, mu));\n    float beersLaw = exp(-stepL*lighRayDen)+0.5*scatterAmount*exp(-0.1*stepL*lighRayDen)+scatterAmount*0.4*exp(-0.02*stepL*lighRayDen);\n    return beersLaw * phaseFunction * mix(0.05 + 1.5*pow(min(1.0, dC*8.5), 0.3+5.5*cloudHeight), 1.0, clamp(lighRayDen*0.4, 0.0, 1.0));\n}\n\nfloat udRoundBox( vec3 p, vec3 b, float r )\n{\n    return length(max(abs(p)-b,0.0))-r;\n}\n\nmat3 cubeForm = mat3(1.0);\nfloat Yelevation = 0.0;\nfloat map( in vec3 pos )\n{\n    pos *= cubeForm;\n    pos.y += Yelevation;\n    \n    pos.y += 3.66;\n    pos.z += 0.4;\n    pos *= 0.35;\n        \n    float res = udRoundBox(  pos-vec3( 0.0,1.25, 0.0), vec3(0.15), 0.01 );\n    res = min( res, udRoundBox(  pos-vec3( 0.33,1.25, 0.0), vec3(0.15), 0.01 ) );\n    res = min( res, udRoundBox(  pos-vec3( 0.33,1.25, 0.33), vec3(0.15), 0.01 ) );\n    res = min( res, udRoundBox(  pos-vec3( 0.0,1.25, 0.33), vec3(0.15), 0.01 ) );\n    \n    res = min( res, udRoundBox(  pos-vec3( 0.0,1.58, 0.0), vec3(0.15), 0.01 ) );\n    res = min( res, udRoundBox(  pos-vec3( 0.0,1.58, 0.33), vec3(0.15), 0.01 ) );\n    res = min( res, udRoundBox(  pos-vec3( 0.33,1.58, 0.0), vec3(0.15), 0.01 ) ); \n    return res;\n}\n\nfloat sea_octave(vec2 uv, float choppy) {\n    uv += noise(uv);        \n    vec2 wv = 1.0-abs(sin(uv));\n    vec2 swv = abs(cos(uv));    \n    wv = mix(wv,swv,wv);\n    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);\n}\n\nfloat mapWater(vec3 p, int steps, bool cube) {\n    float freq = SEA_FREQ;\n    float amp = SEA_HEIGHT;\n    float choppy = SEA_CHOPPY;\n    vec2 uv = p.xz; uv.x *= 0.75;\n    \n    float d, h = 0.0;\n    const float SEA_SPEED = 0.8;\n    const mat2 octave_m = mat2(1.6,1.2,-1.2,1.6);\n    float seaTime = (1.0 + iTime * SEA_SPEED);\n    for(int i = 0; i < steps; i++)\n    {        \n    \td = sea_octave((uv+seaTime)*freq,choppy);\n    \td += sea_octave((uv-seaTime)*freq,choppy);\n        h += d * amp;        \n    \tuv *= octave_m; freq *= 1.9; amp *= 0.22;\n        choppy = mix(choppy,1.0,0.2);\n    }\n    if(!cube)\n        return p.y -h;\n    \n    return p.y - h - 0.2*exp(-max(0.0, 23.0*map(p)));\n}\n\nfloat Schlick (float f0, float VoH )\n{\n\treturn f0+(1.-f0)*pow(1.0-VoH,5.0);\n}\n\nvec3 skyRay(vec3 org, vec3 dir, vec3 sun_direction, bool fast)\n{\n    const float ATM_START = EARTH_RADIUS+CLOUD_START;\n\tconst float ATM_END = ATM_START+CLOUD_HEIGHT;\n    \n    int nbSample = fast ? 13 : 35;   \n    vec3 color = vec3(0.0);\n\tfloat distToAtmStart = intersectSphere(org, dir, vec3(0.0, -EARTH_RADIUS, 0.0), ATM_START);\n    float distToAtmEnd = intersectSphere(org, dir, vec3(0.0, -EARTH_RADIUS, 0.0), ATM_END);\n    vec3 p = org + distToAtmStart * dir;    \n    float stepS = (distToAtmEnd-distToAtmStart) / float(nbSample);    \n    float T = 1.;    \n    float mu = dot(sun_direction, dir);\n    float phaseFunction = numericalMieFit(mu);\n    p += dir*stepS*hash(dot(dir, vec3(12.256, 2.646, 6.356)) + iTime);\n    if(dir.y > 0.015)\n\tfor(int i=0; i<nbSample; i++)\n\t{        \n        float cloudHeight;\n\t\tfloat density = clouds(p, cloudHeight, fast);\n\t\tif(density>0.)\n\t\t{\n\t\t\tfloat intensity = lightRay(p, phaseFunction, density, mu, sun_direction, cloudHeight, fast);        \n            vec3 ambient = (0.5 + 0.6*cloudHeight)*vec3(0.2, 0.5, 1.0)*6.5 + vec3(0.8) * max(0.0, 1.0-2.0*cloudHeight);\n            vec3 radiance = ambient + SUN_POWER*intensity;\n            radiance*=density;\t\t\t\n            color += T*(radiance - radiance * exp(-density * stepS)) / density;   // By Seb Hillaire                  \n            T *= exp(-density*stepS);            \n\t\t\tif( T <= 0.05)\n\t\t\t\tbreak;\n        }\n\t\tp += dir*stepS;\n\t}\n        \n    if(!fast)\n    {\n        vec3 pC = org + intersectSphere(org, dir, vec3(0.0, -EARTH_RADIUS, 0.0), ATM_END+1000.0)*dir;\n    \tcolor += T*vec3(3.0)*max(0.0, fbm(vec3(1.0, 1.0, 1.8)*pC*0.002)-0.4);\n    }\n\tvec3 background = 6.0*mix(vec3(0.2, 0.52, 1.0), vec3(0.8, 0.95, 1.0), pow(0.5+0.5*mu, 15.0))+mix(vec3(3.5), vec3(0.0), min(1.0, 2.3*dir.y));\n    if(!fast) \tbackground += T*vec3(1e4*smoothstep(0.9998, 1.0, mu));\n    color += background * T;\n    \n    return color;\n}\n\nfloat D_GGX(in float r, in float NoH, in vec3 h)\n{\n    float a = NoH * r;\n    float k = r / ((1.0 - NoH * NoH) + a * a);\n    return k * k * (1.0 / PI);\n}\n\nfloat castRay( in vec3 ro, in vec3 rd, in float tmin)\n{\n    float tmax = 10.0;   \n#if 1\n    float maxY = 3.0;\n    float minY = -1.0;\n    // bounding volume\n    float tp1 = (minY-ro.y)/rd.y; if( tp1>0.0 ) tmax = min( tmax, tp1 );\n    float tp2 = (maxY-ro.y)/rd.y; if( tp2>0.0 ) { if( ro.y>maxY ) tmin = max( tmin, tp2 );\n                                                 else           tmax = min( tmax, tp2 ); }\n#endif    \n    float t = tmin;\n    for( int i=0; i<100; i++ )\n    {\n\t    float precis = 0.0005*t;\n\t    float res = map( ro+rd*t );\n        if( res<precis || t>tmax ) break;\n        t += res;\n    }\n    if( t>tmax ) return -1.;\n    return t;\n}\n\n\nfloat softshadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )\n{\n\tfloat res = 1.0;\n    float t = mint;\n    for( int i=0; i<14; i++ )\n    {\n\t\tfloat h = map( ro + rd*t );\n        res = min( res, 8.*h/t );\n        t += clamp( h, 0.08, 0.25 );\n        if( res<0.001 || t>tmax ) break;\n    }\n    return max(0.0, res);\n}\n\nvec3 calcNormal( in vec3 pos)\n{\n    vec2 e = vec2(1.0,-1.0)*EPSILON_NRM;\n    return normalize( e.xyy*map( pos + e.xyy ) + \n\t\t\t\t\t  e.yyx*map( pos + e.yyx ) + \n\t\t\t\t\t  e.yxy*map( pos + e.yxy ) + \n\t\t\t\t\t  e.xxx*map( pos + e.xxx ) );\n}\n\nfloat calcAO( in vec3 pos, in vec3 nor )\n{\n\tfloat sca = 10.2;\n    float hr = 0.05;  \n    float dd = map( nor * 0.15 + pos ); \n    return clamp( 1.0 + (dd-hr)*sca, 0.0, 1.0 );     \n}\n\nvec3 renderCubeFast(in vec3 p, in vec3 dir, in vec3 sun_direction, in float res)\n{\n    vec3 pos = p + res*dir;\n    vec3 nor = calcNormal( pos );\n    float NoL = max(0.0, dot(sun_direction, nor));    \n    vec3 color = 0.6*NoL*SUN_POWER*albedo/PI; // diffuse\n    //color *= softshadow(pos, sun_direction, 0.001, 2.0); // Shadow\n    color += albedo * vec3(0.3, 0.6, 1.0)* 35.0 * (0.75 + 0.25*nor.y); // skylight\n    return color;\n}\n\nfloat HenyeyGreenstein(float mu, float inG)\n{\n\treturn (1.-inG * inG)/(pow(1.+inG*inG - 2.0 * inG*mu, 1.5)*4.0* PI);\n}\n\nvec3 getSeaColor(in vec3 p, in vec3 N, in vec3 sun_direction, in vec3 dir, in vec3 dist, in float mu, in float cloudShadow)\n{    \n    vec3 L = normalize(vec3(0.0)+reflect(dir, N));\n    vec3 V = -dir;\n\tfloat NoV = clamp(abs(dot(N, V))+1e-5,0.0, 1.0);\n    float NoL = max(0.0, dot(N, L));\n    float VoH = max(0.0, dot(V, normalize(V+L)));    \n    float fresnel = Schlick(0.02, NoV);    \n    float cubeRes = castRay(p, L, 0.0001);\n    vec3 reflection = skyRay(p, L, sun_direction, true);\n    if(cubeRes != -1.)\n        reflection = renderCubeFast(p, L, sun_direction, cubeRes);    \n    vec3 color = mix(cloudShadow*SEA_BASE, reflection, fresnel);    \n    float subsurfaceAmount = 12.0*HenyeyGreenstein(mu, 0.5);\n    const vec3 SEA_WATER_COLOR = 0.6*vec3(0.8,0.9,0.6);\n    color += subsurfaceAmount * SEA_WATER_COLOR * max(0.0, 1.0+p.y - 0.6*SEA_HEIGHT);    \n    if(cubeRes == -1.)\n    {\n    \tvec3 H = normalize(V+sun_direction);\n        float NoL = max(0.0, dot(N, sun_direction));\n        float roughness = 0.05;\n    \tcolor += LOW_SCATTER*0.4*vec3(NoL/PI*fresnel*SUN_POWER*D_GGX(roughness, max(0.0, dot(N, H)), H));\n    }\n    color += 9.0*max(0.0, smoothstep(0.35, 0.6, p.y - SEA_HEIGHT) * N.x); // Foam\n    float foamShadow = max(0.0, dot(sun_direction.xz, normalize(p.xz-vec2(0.0, 0.0))));\n    color += foamShadow*2.5*smoothstep(0.06+0.06*N.z,0.0,map(p))*max(0.0, N.y); // Foam at cube entry\n    return color;\n}\n\nvec3 getNormalWater(vec3 p, float eps) {   \n    vec3 n;\n    n.y = mapWater(p, ITER_FRAGMENT, true);    \n    n.x = mapWater(vec3(p.x+eps,p.y,p.z), ITER_FRAGMENT, true) - n.y;\n    n.z = mapWater(vec3(p.x,p.y,p.z+eps), ITER_FRAGMENT, true) - n.y;\n    n.y = eps;  \n    return normalize(n);\n}\n\nfloat heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {  \n    float tm = 0.0;\n    float tx = 1e8;    \n    float hx = mapWater(ori + dir * tx, ITER_GEOMETRY, true);\n    if(hx > 0.0) return tx;   \n    float hm = mapWater(ori + dir * tm, ITER_GEOMETRY, true);    \n    float tmid = 0.0;\n    for(int i = 0; i < 8; i++)\n    {\n        tmid = mix(tm,tx, hm/(hm-hx));                   \n        p = ori + dir * tmid;                   \n    \tfloat hmid = mapWater(p, ITER_GEOMETRY, true);\n\t\tif(hmid < 0.0)\n        {\n        \ttx = tmid;\n            hx = hmid;\n        } else\n        {\n            tm = tmid;\n            hm = hmid;\n        }\n    }\n    return tmid;\n}\n\nvec3 worldReflection(vec3 org, vec3 dir, vec3 sun_direction)\n{    \n    if(castRay(org, dir, 0.05) != -1. || dir.y < 0.0)\n        return vec3(0.0);\n    \n    return skyRay(org, dir, sun_direction, true);\n}\n\nvec3 renderCube(vec3 p, vec3 dir, vec3 sun_direction, float res)\n{\n    vec3 pos = p + res*dir;\n    vec3 nor = calcNormal( pos );\n    float occ = calcAO( pos, nor );\n    float NoL = max(0.0, dot(sun_direction, nor));\n    float sunShadow = softshadow(pos, sun_direction, 0.001, 2.0);\n    vec3 color = 0.6*NoL*SUN_POWER*albedo* sunShadow/PI; // diffuse\n    color += albedo*occ * vec3(0.3, 0.6, 1.0)* 35.0 * (0.75 + 0.25*nor.y); // skylight\n    color += Schlick(0.04, max(0.0, dot(nor, -dir)))*worldReflection(pos, reflect(dir, nor), sun_direction)*max(0.0, occ-0.7)/0.7; // specular\n    return color;\n}\n\nvoid setupCubeForm()\n{\n    const float EPS_EL = 0.9;\n    float elevationX = mapWater(vec3(EPS_EL, 0.0, 0.0), 2, false);\n    float elevationY = mapWater(vec3(-EPS_EL, 0.0, -EPS_EL), 2,false);\n    float elevationZ = mapWater(vec3(-EPS_EL, 0.0, EPS_EL), 2,false);\n    \n    float waveRotX = elevationX - (elevationY + elevationZ) * 0.5;\n    float waveRotZ = ((elevationZ - elevationX)+(elevationX - elevationY))*0.5;\n    vec2 euler = vec2(0.3- waveRotZ, -0.15- waveRotX);    \n    vec2 s = sin(euler);\n    vec2 c = cos(euler);\n    \n    mat3 rotX = mat3(\n        1.0, 0.0, 0.0,\n        0.0, c.x, s.x,\n        0.0, -s.x, c.x\n    );\n      \n    mat3 rotZ = mat3(\n        c.y, s.y, 0.0,\n        -s.y, c.y, 0.0,\n        0.0, 0.0, 1.0\n    );\n    \n    cubeForm = inverse(rotX*rotZ);  \n    Yelevation = 0.333*(elevationX + elevationY + elevationZ);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 q = fragCoord.xy / iResolution.xy;\n    vec2 v = -1.0 + 2.0*q;\n    v.x *= iResolution.x/ iResolution.y;\n    vec2 mo = iMouse.xy / iResolution.xy;\n    \n    float camRot = -7.0*mo.x;\n    vec3 org = (vec3(6.0*cos(camRot), mix(2.2, 10.0, mo.y), 6.0*sin(camRot)));    \n\tvec3 ta = vec3(0.0, mix(1.2, 12.0, mo.y), 0.0);\n    \n    if (iMouse.z < 0.)\n    {\n        vec3 offset = -0.4*vec3(-5.7, 0.0, 1.6);\n        ta = vec3(0.0, 2.9, 0.0)+offset;\n        org = vec3(1.6, 3.1, 5.7)+offset;\n    }\n    \n    vec3 ww = normalize( ta - org);\n    vec3 uu = normalize(cross( vec3(0.0,1.0,0.0), ww ));\n    vec3 vv = normalize(cross(ww,uu));\n    vec3 dir = normalize( v.x*uu + v.y*vv + 1.4*ww );\n\tvec3 color=vec3(.0);\n    vec3 sun_direction = normalize( vec3(0.6,0.45,-0.8) );\n\tfloat fogDistance = intersectSphere(org, dir, vec3(0.0, -EARTH_RADIUS, 0.0), EARTH_RADIUS);\n    float mu = dot(sun_direction, dir);\n    \n    setupCubeForm();\n    float cubeRes = castRay(org, dir, 2.0);\n    \n    // Sky\n    if(fogDistance == -1. && cubeRes == -1.)\n    {\n        color = skyRay(org, dir, sun_direction, false); \n        fogDistance = intersectSphere(org, dir, vec3(0.0, -EARTH_RADIUS, 0.0), EARTH_RADIUS+160.0);\n    }\n    else if(fogDistance == -1. && cubeRes != -1.)\n    {\n        color.xyz = renderCube(org, dir, sun_direction, cubeRes);\n        fogDistance = cubeRes;\n    }\n    else // water\n    {\n        vec3 waterHitPoint;\n    \theightMapTracing(org,dir,waterHitPoint);         \n    \tvec3 dist = waterHitPoint - org;\n    \tvec3 n = getNormalWater(waterHitPoint, dot(dist,dist) * EPSILON_NRM);\n        float cloudShadow= 1.0-textureLod(iChannel0, waterHitPoint.xz*0.008-vec2(0.0, 0.03*iTime), 7.0).x;        \n   \t \tcolor = getSeaColor(waterHitPoint,n,sun_direction,dir,dist, mu, cloudShadow); \n        \n        if(cubeRes != -1.)\n        {\n            float distT = length(dist);\n            if(cubeRes > distT) // Under the water cube\n            {\n                vec3 refr = refract(dir, n, 0.75);\n            \tcubeRes = castRay(waterHitPoint, refr, 0.001);            \t\n                if(cubeRes != -1.)\n                {\n                    vec3 cube = renderCube(waterHitPoint, refr, sun_direction, cubeRes); \n        \t\t\tfloat fresnel = 1.0 - Schlick(0.04, max(0.0, dot(n, -dir)));\n            \t\tcolor.xyz += fresnel * (cube.xyz *vec3(0.7, 0.8, 0.9)*exp(-0.01*vec3(60.0, 15.0, 1.0)*max(0.0, cubeRes)) - SEA_BASE * cloudShadow);\n                }\n            }\n            else\n            {\n                color = renderCube(org, dir, sun_direction, cubeRes);\n            }            \n            fogDistance = cubeRes;\n        }\n    }  \n    \n    float fogPhase = 0.5*HenyeyGreenstein(mu, 0.7)+0.5*HenyeyGreenstein(mu, -0.6);    \n    fragColor = vec4(mix(fogPhase*0.1*LOW_SCATTER*SUN_POWER+10.0*vec3(0.55, 0.8, 1.0), color, exp(-0.0003*fogDistance)), 1.0);\n}\n",
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
            "code": "float hash( float n )\n{\n    return fract(sin(n)*43758.5453);\n}\n\n// https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/\nvec3 tonemapACES( vec3 x )\n{\n    float a = 2.51;\n    float b = 0.03;\n    float c = 2.43;\n    float d = 0.59;\n    float e = 0.14;\n    return (x*(a*x+b))/(x*(c*x+d)+e);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 q = fragCoord.xy / iResolution.xy;    \n    vec2   blurRadius    = vec2(20.0) / iResolution.xy;\n\n    vec4 sum = vec4(0.0);\n    float NUM_SAMPLES = 20.;\n    float phiOffset = hash(dot(fragCoord.xy, vec2(1.12,2.251)) + iTime);\n    for(float i = 0.; i < NUM_SAMPLES; i++)\n    {\n        vec2 r = blurRadius * i / NUM_SAMPLES;\n        float phi = (i / NUM_SAMPLES + phiOffset) * 2.0 * 3.1415926;\n        vec2 uv = q + vec2(sin(phi), cos(phi))*r;\n        sum += textureLod(iChannel0, uv, 0.0);\n    }\n    const float BLOOM_AMOUNT = 0.05;\n    sum.xyz = mix(textureLod(iChannel0, q, 0.0).xyz, sum.xyz / NUM_SAMPLES, BLOOM_AMOUNT);\n    // Make it look as if some auto exposure magic is going on\n    float exposure = 0.06 * (1.0+0.2*sin(0.5*iTime)*sin(1.8*iTime));\n\tfragColor = vec4(tonemapACES(exposure*sum.xyz), 1.0);\n}\n",
            "name": "Buffer B",
            "description": "",
            "type": "buffer"
          },
          {
            "outputs": [
              {
                "channel": 0,
                "id": "4sXGR8"
              }
            ],
            "inputs": [
              {
                "channel": 0,
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
              },
              {
                "channel": 1,
                "type": "buffer",
                "id": "4sXGR8",
                "filepath": "/media/previz/buffer02.png",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "\nivec2 offsets[8] = ivec2[8]( ivec2(-1,-1), ivec2(-1, 1), \n\tivec2(1, -1), ivec2(1, 1), \n\tivec2(1, 0), ivec2(0, -1), \n\tivec2(0, 1), ivec2(-1, 0));\n\nvec3 RGBToYCoCg( vec3 RGB )\n{\n\tfloat Y = dot(RGB, vec3(  1, 2,  1 )) * 0.25;\n\tfloat Co= dot(RGB, vec3(  2, 0, -2 )) * 0.25 + ( 0.5 * 256.0/255.0 );\n\tfloat Cg= dot(RGB, vec3( -1, 2, -1 )) * 0.25 + ( 0.5 * 256.0/255.0 );\n\treturn vec3(Y, Co, Cg);\n}\n\nvec3 YCoCgToRGB( vec3 YCoCg )\n{\n\tfloat Y= YCoCg.x;\n\tfloat Co= YCoCg.y - ( 0.5 * 256.0 / 255.0 );\n\tfloat Cg= YCoCg.z - ( 0.5 * 256.0 / 255.0 );\n\tfloat R= Y + Co-Cg;\n\tfloat G= Y + Cg;\n\tfloat B= Y - Co-Cg;\n\treturn vec3(R,G,B);\n}\n\n//#define NO_AA\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 q = fragCoord.xy / iResolution.xy;    \n    vec3 new = RGBToYCoCg(textureLod(iChannel0, q, 0.0).xyz);\n    vec3 history = RGBToYCoCg(textureLod(iChannel1, q, 0.0).xyz);\n    \n    vec3 colorAvg = new;\n    vec3 colorVar = new*new;\n    \n    // Marco Salvi's Implementation (by Chris Wyman)\n    for(int i = 0; i < 8; i++)\n    {\n        vec3 fetch = RGBToYCoCg(texelFetch(iChannel0, ivec2(fragCoord.xy)+offsets[i], 0).xyz);\n        colorAvg += fetch;\n        colorVar += fetch*fetch;\n    }\n    colorAvg /= 9.0;\n    colorVar /= 9.0;\n    float gColorBoxSigma = 0.75;\n\tvec3 sigma = sqrt(max(vec3(0.0), colorVar - colorAvg*colorAvg));\n\tvec3 colorMin = colorAvg - gColorBoxSigma * sigma;\n\tvec3 colorMax = colorAvg + gColorBoxSigma * sigma;\n    \n    history = clamp(history, colorMin, colorMax);\n  \n\tfragColor = vec4(YCoCgToRGB(mix(new, history, 0.95)), 1.0);\n#ifdef NO_AA\n    fragColor = vec4(YCoCgToRGB(new), 1.0);\n#endif\n}\n",
            "name": "Buffer C",
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
          "id": "4dSBDt",
          "date": "1503443177",
          "viewed": 28342,
          "name": "Enscape Cube",
          "username": "ThomasSchander",
          "description": "An ocean scene with a floating logo of our Enscape renderer. Clouds are inspired by Andrew Schneider, Water gen. is from TDM, TAA by Marco Salvi.\nThe clouds use my fitted phase function (toy: 4sjBDG). If you look long enough, you can feel the fresh air!",
          "likes": 319,
          "published": 3,
          "flags": 32,
          "usePreview": 1,
          "tags": [
            "clouds",
            "cloud",
            "water",
            "ocean",
            "sky",
            "volumetric",
            "scattering",
            "rayleigh",
            "mie",
            "phase",
            "henyey"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);