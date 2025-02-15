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
              },
              {
                "channel": 2,
                "type": "musicstream",
                "id": "4llSRr",
                "filepath": "https://soundcloud.com/parmesanpiment/thylacine-train",
                "sampler": {
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec2 invRes = vec2(1.) / iResolution.xy;\n    vec2 uv = fragCoord/iResolution.xy;\n\n    // Base color\n    vec2 offset = (uv*2.-1.) * invRes*1.3;\n    vec3 col = vec3(0.);\n    col.r = texture(iChannel0, uv+offset).r;\n    col.g = texture(iChannel0, uv-offset).g;\n    col.b = texture(iChannel0, uv+offset).b;\n    \n    float t = texture(iChannel0, uv+offset).a;\n    \n    // blur godrays\n    vec4 godray = vec4(0.);\n    for(float x=-3.; x<=3.; x+=1.)\n    for(float y=-3.; y<=3.; y+=1.) { \n        vec4 tap = texture(iChannel1,uv*.5+vec2(x,y)*invRes);\n        float w = 1.;\n        if(tap.w>t+1. && t <8.)\n            w = 0.;\n    \tgodray += vec4(tap.rgb,1.)*w;\n    }\n    godray /= godray.w; \n    col += FOGCOLOR*godray.rgb*.01;\n    \n    col = pow(col, vec3(1./2.2));\n    col = pow(col, vec3(.6,1.,.8*(uv.y*.2+.8)));\n    \n    // Vignetting\n    float vignetting = pow(uv.x*uv.y*(1.-uv.x)*(1.-uv.y), .3)*2.5;\n    col *= vignetting;\n    //col *= .7+texture(iChannel2, vec2(0.1,0.0)).r;\n    \n    // Output to screen\n    fragColor = vec4(col,1.0) * smoothstep(0.,10.,iTime);\n}",
            "name": "Image",
            "description": "",
            "type": "image"
          },
          {
            "outputs": [],
            "inputs": [],
            "code": "#define PI 3.14159265\n\n#define saturate(x) clamp(x,0.,1.)\n#define SUNDIR normalize(vec3(0.2,.3,2.))\n#define FOGCOLOR vec3(1.,.2,.1)\n\nfloat smin( float a, float b, float k );\nfloat smax( float a, float b, float k );\nfloat box( vec3 p, vec3 b, float r );\nfloat capsule( vec3 p, float h, float r );\nvec3 hash( uint n );\nmat2 rot(float v);\n\n\nfloat time;\n\nfloat train(vec3 p) {\n    \n    // base \n    float d = abs(box(p-vec3(0., 0., 0.), vec3(100.,1.5,5.), 0.))-.1;\n    \n    // windows\n    d = smax(d, -box(p-vec3(1.,0.25,5.), vec3(2.,.5,0.0), .3), 0.03);\n    d = smax(d, -box(p-vec3(-3.,0.25,5.), vec3(.2,.5,0.0), .3), 0.03);\n    d = smin(d,  box(p-vec3(1.,0.57,5.), vec3(5.3,.05,0.1), .0), 0.001);\n    \n    // seats\n    p.x = mod(p.x-.8,2.)-1.;\n    p.z = abs(p.z-4.3)-.3;\n    d = smin(d, box(p-vec3(0.,-1., 0.), vec3(.3,.1-cos(p.z*PI*4.)*.01,.2),.05), 0.05);\n    d = smin(d, box(p-vec3(0.4+pow(p.y+1.,2.)*.1,-0.38, 0.), vec3(.1-cos(p.z*PI*4.)*.01,.7,.2),.05), 0.1);\n    d = smin(d, box(p-vec3(0.1,-1.3, 0.), vec3(.1,.2,.1),.05), 0.01);\n\n    return d;\n}\n\nfloat catenary(vec3 p) {\n    \n    p.z -= 12.;\n    vec3 pp = p;\n    p.x = mod(p.x,10.)-5.;\n    \n    // base\n    float d = box(p-vec3(0.,0.,0.), vec3(.0,3.,.0), .1);\n    d = smin(d, box(p-vec3(0.,2.,0.), vec3(.0,0.,1.), .1), 0.05);\n    p.z = abs(p.z-0.)-2.;\n    d = smin(d, box(p-vec3(0.,2.2,-1.), vec3(.0,0.2,0.), .1), 0.01);\n    \n    // lines\n    pp.z = abs(pp.z-0.)-2.;\n    d = min(d, capsule(p-vec3(-5.,2.4-abs(cos(pp.x*.1*PI)),-1.),10000.,.02));\n    d = min(d, capsule(p-vec3(-5.,2.9-abs(cos(pp.x*.1*PI)),-2.),10000.,.02));\n    \n    return d;\n}\n\n\nfloat city(vec3 p) {\n    vec3 pp = p;\n    ivec2 pId = ivec2((p.xz)/30.);\n    vec3 rnd = hash(uint(pId.x + pId.y*1000));\n    p.xz = mod(p.xz, vec2(30.))-15.;\n    float h = 5.+float(pId.y-3)*5.+rnd.x*20.;\n    float offset = (rnd.z*2.-1.)*10.;\n    float d = box(p-vec3(offset,-5.,0.), vec3(5.,h,5.), 0.1);\n    d = min(d, box(p-vec3(offset,-5.,0.), vec3(1.,h+pow(rnd.y,4.)*10.,1.), 0.1));\n    d = max(d,-pp.z+100.);\n    d = max(d,pp.z-300.);\n    \n    return d*.6;\n}\n\nfloat map(vec3 p) {\n    float d = train(p);\n    p.x -= mix(0.,time*15., saturate(time*.02));\n    d = min(d, catenary(p));\n    d = min(d, city(p));\n    d = min(d, city(p+15.));\n    return d;\n}\n\nfloat shadow( in vec3 ro, in vec3 rd, in float mint, in float tmax )\n{\n    float t = mint;\n    for(int i=0; i<128; i++) {\n        float d = map(ro+rd*t);\n        if (abs(d)<0.01) break;\n        t += d;\n        if (t > 300.) return 1.;\n    }\n    return 0.;\n}\n\n\nvec3 randomSphereDir( vec2 rnd )\n{\n    float s = rnd.x*PI*2.;\n    float t = rnd.y*2.-1.;\n    return vec3(sin(s), cos(s), t) / sqrt(1.0 + t * t);\n}\n\nfloat hash( float p ) \n{\n    return fract(sin(p)*43758.5453123);\n}\n\nvec3 randomHemisphereDir( vec3 dir, float i )\n{\n    vec3 v = randomSphereDir( vec2(hash(i+1.), hash(i+2.)) );\n    return v * sign(dot(v, dir));\n}\nfloat ambientOcclusion( vec3 p, vec3 n, float maxDist, float falloff )\n{\n\tconst int nbIte = 16;\n    const float nbIteInv = 1./float(nbIte);\n    const float rad = 1.-1.*nbIteInv; //Hemispherical factor (self occlusion correction)\n    \n\tfloat ao = 0.0;\n    \n    for( int i=0; i<nbIte; i++ )\n    {\n        float l = hash(float(i))*maxDist;\n        vec3 rd = normalize(n+randomHemisphereDir(n, l )*rad)*l; // mix direction with the normal\n        \t\t\t\t\t\t\t\t\t\t\t\t\t    // for self occlusion problems!\n        \n        ao += (l - max(map( p + rd ),0.)) / maxDist * falloff;\n    }\n\t\n    return clamp( 1.-ao*nbIteInv, 0., 1.);\n}\n\n// https://iquilezles.org/articles/smin\nfloat smin( float a, float b, float k )\n{\n    float h = max(k-abs(a-b),0.0);\n    return min(a, b) - h*h*0.25/k;\n}\n\n// https://iquilezles.org/articles/smin\nfloat smax( float a, float b, float k )\n{\n    k *= 1.4;\n    float h = max(k-abs(a-b),0.0);\n    return max(a, b) + h*h*h/(6.0*k*k);\n}\n\nfloat box( vec3 p, vec3 b, float r )\n{\n  vec3 q = abs(p) - b;\n  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;\n}\n\nfloat capsule( vec3 p, float h, float r )\n{\n  p.x -= clamp( p.x, 0.0, h );\n  return length( p ) - r;\n}\n\nvec3 hash( uint n ) \n{\n    // integer hash copied from Hugo Elias\n\tn = (n << 13U) ^ n;\n    n = n * (n * n * 15731U + 789221U) + 1376312589U;\n    uvec3 k = n * uvec3(n,n*16807U,n*48271U);\n    return vec3( k & uvec3(0x7fffffffU))/float(0x7fffffff);\n}\n\nfloat hash2Interleaved( vec2 x )\n{\n    // between random & dithered pattern\n    // good for jittering and blur as well as blue noise :)\n    // http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare\n    vec3 magic = vec3( 0.06711056, 0.00583715, 52.9829189 );\n    return fract( magic.z * fract( dot( x, magic.xy ) ) );\n}\n\nmat2 rot(float v) {\n    float a = cos(v);\n    float b = sin(v);\n    return mat2(a,-b,b,a);\n}",
            "name": "Common",
            "description": "",
            "type": "common"
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
                "id": "XsBSR3",
                "filepath": "/media/a/cb49c003b454385aa9975733aff4571c62182ccdda480aaba9a8d250014f00ec.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "\n\n\nfloat trace(vec3 ro, vec3 rd, vec2 nearFar) {\n    float t = nearFar.x;\n    for(int i=0; i<128; i++) {\n        float d = map(ro+rd*t);\n        t += d;\n        if( abs(d) < 0.001 || t > nearFar.y )\n            break;\n    }\n    \n    return t;\n}\nfloat traceFast(vec3 ro, vec3 rd, vec2 nearFar) {\n    float t = nearFar.x;\n    for(int i=0; i<64; i++) {\n        float d = map(ro+rd*t);\n        t += d;\n        if( abs(d) < 0.001 || t > nearFar.y )\n            break;\n    }\n    \n    return t;\n}\n\nvec3 normal(vec3 p, float t) {\n    vec2 eps = vec2(0.01, 0.);\n    float d = map(p);\n    \n    vec3 n;\n    n.x = d - map(p-eps.xyy);\n    n.y = d - map(p-eps.yxy);\n    n.z = d - map(p-eps.yyx);\n    n = normalize(n);\n    \n    return n;\n}\n\nvec3 skyColor(vec3 rd) {\n    vec3 col = FOGCOLOR;\n    col += vec3(1.,.3,.1)*1. * pow(max(dot(rd,SUNDIR),0.),30.);\n    col += vec3(1.,.3,.1)*10. * pow(max(dot(rd,SUNDIR),0.),10000.);\n    return col;\n}\n\nvec3 shade(vec3 ro, vec3 rd, vec3 p, vec3 n) {\n    vec3 col = vec3(0.);\n    \n    vec3 diff = vec3(1.,.5,.3) * max(dot(n,SUNDIR),0.);\n    vec3 amb = vec3(0.1,.15,.2) * ambientOcclusion(p,n, .75,1.5);\n    //float shad = shadow(p,SUNDIR, 0.1,200.);\n    \n    col = diff *.03;// * shad;\n    col = (diff*0.3 + amb*.3)*.02;\n    \n    return col;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    time = iTime;\n    vec2 invRes = vec2(1.) / iResolution.xy;\n    vec2 uv = fragCoord * invRes;\n    \n    vec2 jitt = vec2(0.);\n    #if 1\n    vec2 blue = texture(iChannel1, (fragCoord.xy) / vec2(1024.0)).zw;\n    blue = fract(blue + float(iFrame%256) * 0.61803398875);\n    jitt = (blue-.5)*1. * invRes;\n\t#endif\n    vec2 v = -1.0+2.0*(uv+jitt);\n\tv.x *= iResolution.x/iResolution.y;\n    \n    vec3 ro = vec3(-1.5,-.4,1.2);\n    vec3 rd = normalize(vec3(v, 2.5));\n    rd.xz = rot(.15)*rd.xz;\n    rd.yz = rot(.1)*rd.yz;\n    \n    float t = trace(ro,rd, vec2(0.,300.));\n    vec3 p = ro + rd * t;\n    vec3 n = normal(p,t);\n    vec3 col = skyColor(rd);\n    \n    if (t < 300.) {\n        col = shade(ro,rd, p,n);\n    \n        if (p.z<6.) {\n            vec3 rrd = reflect(rd,n);\n            float t2 = traceFast(p, rrd, vec2(0.1,300.));\n            vec3 rp = p + rrd * t2;\n            vec3 rn = normal(rp,t2);\n            float fre = pow( saturate( 1.0 + dot(n,rd)), 8.0 );\n            vec3 rcol = skyColor(rrd);\n            if (t2 < 300.) {\n                rcol = shade(p,rrd, rp, rn);\n            \trcol = mix(col, FOGCOLOR, smoothstep(100.,500.,t2));\n            }\n            col = mix(col, rcol, fre*.1);\n        }\n\n\n        col = mix(col, FOGCOLOR, smoothstep(100.,500.,t));\n    }\n    \n    if (p.z<6.) {\n    \tfragColor = mix(texture(iChannel0, uv), vec4(col,t), 0.2);\n    } else {\n        fragColor = vec4(col,t);\n    }\n}",
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
            "code": "float phaseFunction(float lightDotView)\n{\n    const float k = .9;\n\tfloat v = 1.0 - k * k;\n\tv /= (4.0 * PI * pow(1.0 + k * k - (2.0 * k)*lightDotView, 1.5));\n\treturn v;\n}\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // early exit because we want half resolution\n    vec2 invRes = vec2(1.) / iResolution.xy;\n    vec2 uv = fragCoord * invRes*2.;\n    if(uv.x>1. || uv.y>1. )\n    {\n        fragColor = vec4(0.);\n        return;\n    } \n    \n    time = iTime;\n\tfloat l = texture(iChannel0, uv).a;\n    \n    vec2 v = -1.0+2.0*(uv);\n\tv.x *= iResolution.x/iResolution.y;\n    \n    vec3 ro = vec3(-1.5,-.4,1.2);\n    vec3 rd = normalize(vec3(v, 2.5));\n    rd.xz = rot(.15)*rd.xz;\n    rd.yz = rot(.1)*rd.yz;\n    \n    \n    float jitt = hash2Interleaved(gl_FragCoord.xy)*.2;\n    const float eps = 0.2;\n    \n    // acc shadow loop\n    float phase = phaseFunction(dot(SUNDIR,rd));\n    vec3 godray = vec3(0.);\n    for(float i=0.0; i<1.; i+=eps) {\n       vec3 p = ro+rd*l*(i+jitt);\n       float d = shadow(p, SUNDIR, float(.1), float(500.));\n       godray += d * phase;\n    }\n\tgodray = godray;\n        \n    \n    fragColor = vec4(godray,l);\n}",
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
            "code": "void mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\t\n    vec2 invRes = vec2(1.) / iResolution.xy;\n    vec2 uv = fragCoord * invRes;\n    \n    vec4 center = texture( iChannel0, uv);\n    \n    vec4 acc = vec4(center.rgb, 1.);\n    if (center.w>8.) {\n        const int N = 3;\n        for(int j=-N; j<=N; j++)\n        for(int i=-N; i<=N; i++)\n        {\n            vec2 offset = vec2(i,j) * invRes;\n            vec4 tap = texture(iChannel0, uv + offset*.8);\n            acc += vec4(tap.rgb,tap.w>8.);\n        }\n    }\n    acc.rgb /= acc.w;\n    \n    fragColor = vec4(acc.rgb, center.w);\n\n}",
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
          "mFlagMusicStream": true
        },
        "info": {
          "id": "wdKBz1",
          "date": "1606606870",
          "viewed": 6796,
          "name": "Morning Commute",
          "username": "XT95",
          "description": "Inspired by https://twitter.com/HarryAlisavakis/status/1326077058112491521",
          "likes": 188,
          "published": 3,
          "flags": 96,
          "usePreview": 1,
          "tags": [
            "godrays",
            "train"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);