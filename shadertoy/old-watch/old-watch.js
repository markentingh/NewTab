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
                "type": "cubemap",
                "id": "XsfGzn",
                "filepath": "/media/a/585f9546c092f53ded45332b343144396c0b2d70d9965f585ebc172080d8aa58.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              },
              {
                "channel": 1,
                "type": "texture",
                "id": "XsfGRn",
                "filepath": "/media/a/1f7dca9c22f324751f2a5a59c9b181dfe3b5564a04b724c657732d0bf09c99db.jpg",
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
                "channel": 3,
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
            "code": "// Old watch (IBL). Created by Reinder Nijhoff 2018\n// Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.\n// @reindernijhoff\n//\n// https://www.shadertoy.com/view/lscBW4\n//\n// This shader uses Image Based Lighting (IBL) to render an old watch. The\n// materials of the objects have physically-based properties.\n//\n// A material is defined by its albedo and roughness value and it can be a \n// metal or a non-metal.\n//\n// I have used the IBL technique as explained in the article 'Real Shading in\n// Unreal Engine 4' by Brian Karis of Epic Games.[1] According to this article,\n// the lighting of a material is the sum of two components:\n// \n// 1. Diffuse: a look-up (using the normal vector) in a pre-computed environment map.\n// 2. Specular: a look-up (based on the reflection vector and the roughness of the\n//       material) in a pre-computed environment map, combined with a look-up in a\n//       pre-calculated BRDF integration map (Buf B).  \n// \n// Note that I do NOT (pre)compute the environment maps needed in this shader. Instead,\n// I use (the lod levels of) a Shadertoy cubemap that I have remapped using a random \n// function to get something HDR-ish. This is not correct and not how it is described\n// in the article, but I think that for this scene the result is good enough.\n//\n// I made a shader that renders this same scene using a simple path tracer. You can\n// compare the result here:\n//\n// https://www.shadertoy.com/view/MlyyzW\n//\n// [1] http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf\n//\n\n#define MAX_LOD 8.\n#define DIFFUSE_LOD 6.75\n#define AA 2\n// #define P_MALIN_AO \n\nvec3 getSpecularLightColor( vec3 N, float roughness ) {\n    // This is not correct. You need to do a look up in a correctly pre-computed HDR environment map.\n    return pow(textureLod(iChannel0, N, roughness * MAX_LOD).rgb, vec3(4.5)) * 6.5;\n}\n\nvec3 getDiffuseLightColor( vec3 N ) {\n    // This is not correct. You need to do a look up in a correctly pre-computed HDR environment map.\n    return .25 +pow(textureLod(iChannel0, N, DIFFUSE_LOD).rgb, vec3(3.)) * 1.;\n}\n\n//\n// Modified FrenelSchlick: https://seblagarde.wordpress.com/2011/08/17/hello-world/\n//\nvec3 FresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness) {\n    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);\n}\n\n//\n// Image based lighting\n//\n\nvec3 lighting(in vec3 ro, in vec3 pos, in vec3 N, in vec3 albedo, in float ao, in float roughness, in float metallic ) {\n    vec3 V = normalize(ro - pos); \n    vec3 R = reflect(-V, N);\n    float NdotV = max(0.0, dot(N, V));\n\n    vec3 F0 = vec3(0.04); \n    F0 = mix(F0, albedo, metallic);\n\n    vec3 F = FresnelSchlickRoughness(NdotV, F0, roughness);\n\n    vec3 kS = F;\n\n    vec3 prefilteredColor = getSpecularLightColor(R, roughness);\n    vec2 envBRDF = texture(iChannel3, vec2(NdotV, roughness)).rg;\n    vec3 specular = prefilteredColor * (F * envBRDF.x + envBRDF.y);\n\n    vec3 kD = vec3(1.0) - kS;\n\n    kD *= 1.0 - metallic;\n\n    vec3 irradiance = getDiffuseLightColor(N);\n\n    vec3 diffuse  = albedo * irradiance;\n\n#ifdef P_MALIN_AO\n    vec3 color = kD * diffuse * ao + specular * calcAO(pos, R);\n#else\n    vec3 color = (kD * diffuse + specular) * ao;\n#endif\n\n    return color;\n}\n\n//\n// main \n//\n\nvec3 render( const in vec3 ro, const in vec3 rd ) {\n    vec3 col = vec3(0); \n    vec2 res = castRay( ro, rd );\n\n    if (res.x > 0.) {\n        vec3 pos = ro + rd * res.x;\n        vec3 N, albedo;\n        float roughness, metallic, ao;\n\n        getMaterialProperties(pos, res.y, N, albedo, ao, roughness, metallic, iChannel1, iChannel2, iChannel3);\n\n        col = lighting(ro, pos, N, albedo, ao, roughness, metallic);\n        col *= max(0.0, min(1.1, 10./dot(pos,pos)) - .15);\n    }\n\n    // Glass. \n    float glass = castRayGlass( ro, rd );\n    if (glass > 0. && (glass < res.x || res.x < 0.)) {\n        vec3 N = calcNormalGlass(ro+rd*glass);\n        vec3 pos = ro + rd * glass;\n\n        vec3 V = normalize(ro - pos); \n        vec3 R = reflect(-V, N);\n        float NdotV = max(0.0, dot(N, V));\n\n        float roughness = texture(iChannel2, pos.xz*.5 + .5).g;\n\n        vec3 F = FresnelSchlickRoughness(NdotV, vec3(.08), roughness);\n        vec3 prefilteredColor = getSpecularLightColor(R, roughness);\n        vec2 envBRDF = texture(iChannel3, vec2(NdotV, roughness)).rg;\n        vec3 specular = prefilteredColor * (F * envBRDF.x + envBRDF.y);\n\n        col = col * (1.0 -  (F * envBRDF.x + envBRDF.y) ) + specular;\n    } \n\n    // gamma correction\n    col = max( vec3(0), col - 0.004);\n    col = (col*(6.2*col + .5)) / (col*(6.2*col+1.7) + 0.06);\n    \n    return col;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    vec2 uv = fragCoord/iResolution.xy;\n    vec2 mo = iMouse.xy/iResolution.xy - .5;\n    if(iMouse.z <= 0.) {\n        mo = vec2(.2*sin(-iTime*.1+.3)+.045,.1-.2*sin(-iTime*.1+.3));\n    }\n    float a = 5.05;\n    vec3 ro = vec3( .25 + 2.*cos(6.0*mo.x+a), 2. + 2. * mo.y, 2.0*sin(6.0*mo.x+a) );\n    vec3 ta = vec3( .25, .5, .0 );\n    mat3 ca = setCamera( ro, ta );\n\n    vec3 colT = vec3(0);\n    \n    for (int x=0; x<AA; x++) {\n        for(int y=0; y<AA; y++) {\n\t\t    vec2 p = (-iResolution.xy + 2.0*(fragCoord + vec2(x,y)/float(AA) - .5))/iResolution.y;\n   \t\t\tvec3 rd = ca * normalize( vec3(p.xy,1.6) );  \n            colT += render( ro, rd);           \n        }\n    }\n    \n    colT /= float(AA*AA);\n    \n    fragColor = vec4(colT, 1.0);\n}\n\nvoid mainVR( out vec4 fragColor, in vec2 fragCoord, in vec3 ro, in vec3 rd ) {\n\tMAX_T = 1000.;\n    fragColor = vec4(render(ro * 25. + vec3(0.5,4.,1.5), rd), 1.);\n}",
            "name": "Image",
            "description": "",
            "type": "image"
          },
          {
            "outputs": [],
            "inputs": [],
            "code": "// Old watch (IBL). Created by Reinder Nijhoff 2018\n// @reindernijhoff\n//\n// https://www.shadertoy.com/view/lscBW4\n//\n// I have moved all ray-march code to this tab, in order to keep the IBL-code in the \n// 'Image tab' more readable. The physically-based properties of the materials are also \n// defined here.\n//\n// All (signed) distance field (SDF) code is copy-paste from the excellent framework by \n// Inigo Quilez:\n//\n// https://www.shadertoy.com/view/Xds3zN\n//\n// More info here: https://iquilezles.org/articles/distfunctions\n//\n\n#define MAT_TABLE    1.\n#define MAT_PENCIL_0 2.\n#define MAT_PENCIL_1 3.\n#define MAT_PENCIL_2 4.\n#define MAT_DIAL     5.\n#define MAT_HAND     6.\n#define MAT_METAL_0  7.\n#define MAT_METAL_1  8.\n\n#define CLOCK_ROT_X -0.26\n#define CLOCK_ROT_Y 0.2\n#define CLOCK_OFFSET_Y 0.42\n#define PENCIL_POS vec3(-0.31,-0.2, -.725)\n\nfloat MAX_T = 10.;\n\n//\n// SDF functions (by Inigo Quilez).\n//\n\nfloat sdPlane( const vec3 p ) {\n\treturn p.y;\n}\n\nfloat sdTorus( const vec3 p, const vec2 t ) {\n  vec2 q = vec2(length(p.xz)-t.x,p.y);\n  return length(q)-t.y;\n}\n\nfloat sdTorusYZ( const vec3 p, const vec2 t ) {\n  vec2 q = vec2(length(p.yz)-t.x,p.x);\n  return length(q)-t.y;\n}\n\nfloat sdTorusYX( const vec3 p, const vec2 t ) {\n  vec2 q = vec2(length(p.yx)-t.x,p.z);\n  return length(q)-t.y;\n}\n\nfloat sdCylinder( const vec3 p, const vec2 h ) {\n  vec2 d = abs(vec2(length(p.xz),p.y)) - h;\n  return min(max(d.x,d.y),0.0) + length(max(d,0.0));\n}\n\nfloat sdCylinderZY( const vec3 p, const vec2 h ) {\n  vec2 d = abs(vec2(length(p.zy),p.x)) - h;\n  return min(max(d.x,d.y),0.0) + length(max(d,0.0));\n}\n\nfloat sdCylinderXY( const vec3 p, const vec2 h ) {\n  vec2 d = abs(vec2(length(p.xy),p.z)) - h;\n  return min(max(d.x,d.y),0.0) + length(max(d,0.0));\n}\n\n\nfloat sdHexPrism( const vec3 p, const vec2 h ) {\n    vec3 q = abs(p);\n#if 0\n    return max(q.x-h.y,max((q.z*0.866025+q.y*0.5),q.y)-h.x);\n#else\n    float d1 = q.x-h.y;\n    float d2 = max((q.z*0.866025+q.y*0.5),q.y)-h.x;\n    return length(max(vec2(d1,d2),0.0)) + min(max(d1,d2), 0.);\n#endif\n}\n\nfloat sdEllipsoid( const vec3 p, const vec3 r ) {\n    return (length( p/r ) - 1.0) * min(min(r.x,r.y),r.z);\n}\n\nfloat sdCapsule( const vec3 p, const vec3 a, const vec3 b, const float r ) {\n\tvec3 pa = p-a, ba = b-a;\n\tfloat h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );\n\treturn length( pa - ba*h ) - r;\n}\n\nfloat sdSphere( const vec3 p, const float r ) {\n    return length(p) - r;\n}\n\nfloat sdCone( const vec3 p, const vec2 c ) {\n    float q = length(p.yz);\n    return dot(c,vec2(q,p.x));\n}\n\nfloat sdSegment2D( const vec2 p, const vec2 a, const vec2 b, const float w ) {\n\tvec2 pa = p-a, ba = b-a;\n\tfloat h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );\n\treturn length( pa - ba*h ) - w;\n}\n\nfloat opS( const float d1, const float d2 ) {\n    return max(-d1,d2);\n}\n\nfloat opU( const float d1, const float d2 ) {\n    return min(d1,d2);\n}\n\nvec3 rotateX( in vec3 p, const float t ) {\n    float co = cos(t);\n    float si = sin(t);\n    p.yz = mat2(co,-si,si,co)*p.yz;\n    return p;\n}\n\nvec3 rotateY( in vec3 p, const float t ) {\n    float co = cos(t);\n    float si = sin(t);\n    p.xz = mat2(co,-si,si,co)*p.xz;\n    return p;\n}\n\nvec3 rotateZ( in vec3 p, const float t ) {\n    float co = cos(t);\n    float si = sin(t);\n    p.xy = mat2(co,-si,si,co)*p.xy;\n    return p;\n}\n\nvec2 rotate( in vec2 p, const float t ) {\n    float co = cos(t);\n    float si = sin(t);\n    p = mat2(co,-si,si,co) * p;\n    return p;\n}\n\n//\n// Hash without Sine by Dave Hoskins.\n//\n\nfloat hash11(float p) {\n\tvec3 p3  = fract(vec3(p) * .1031);\n    p3 += dot(p3, p3.yzx + 19.19);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\n//\n// SDF of the scene.\n//\n\nfloat mapHand( const vec3 pos, const float w, const float l, const float r ) {\n    float d = sdSegment2D(pos.xz, vec2(0,-w*10.), vec2(0,l), w);\n    d = min(d, length(pos.xz) - (.03+r));\n    return max(d, abs(pos.y)-.005);\n}\n\nvec2 map( in vec3 pos, in vec3 p1, in vec3 ps, in vec3 pm, in vec3 ph, \n         const bool watchIntersect, const bool pencilIntersect ) {\n    //--- table\n    vec2 res = vec2(sdPlane(pos), MAT_TABLE);\n    \n    // chain\n    if (pos.z > 1.1) {\n        float h = smoothstep(3., -.4, pos.z)*.74 + .045;\n        float dChain0 = length(pos.xy+vec2(.3*sin(pos.z), -h))-.1;\n        if (dChain0 < 0.1) {\n            dChain0 = 10.;\n            float pth1z = floor(pos.z*5.);\n            if (pth1z > 5.) {\n\t            float pth1 = hash11(floor(pos.z*5.));\n    \t        vec3 pt1 = vec3(pos.x + .3*sin(pos.z)- pth1 *.02 + 0.02, pos.y-h - pth1 *.03, mod(pos.z, .2) - .1);\n        \t    pt1 = rotateZ(pt1, .6 * smoothstep(2.,3., pos.z));\n            \tdChain0 = sdTorus(pt1, vec2(.071, .02)); \n            }\n            \n            float pth2z = floor(pos.z*5. + .5);\n            float pth2 = hash11(pth2z); \n            vec3 pt2 = vec3(pos.x + .3*sin(pos.z)- pth2 *.02 + 0.02, pos.y-h - pth2 *.03, mod(pos.z + .1, .2) - .1);\n            pt2 = rotateZ(pt2, 1.1 * smoothstep(2.,3., pos.z));\n            dChain0 = opU(dChain0, sdTorusYZ(pt2, vec2(.071, .02)));          \n        }\n        if (dChain0 < res.x) res = vec2(dChain0, MAT_METAL_1);\n    }\n    //--- pencil\n    if (pencilIntersect) {\n        float dPencil0 = sdHexPrism(pos + PENCIL_POS, vec2(.2, 2.));\n        dPencil0 = opS(-sdCone(pos + (PENCIL_POS + vec3(-2.05,0,0)), vec2(.95,0.3122)),dPencil0);\n        dPencil0 = opS(sdSphere(pos + (PENCIL_POS + vec3(-2.4,-2.82,-1.03)), 3.), dPencil0);\n        dPencil0 = opS(sdSphere(pos + (PENCIL_POS + vec3(-2.5,-0.82,2.86)), 3.), dPencil0);\n        if (dPencil0 < res.x) res = vec2(dPencil0, MAT_PENCIL_0);\n\n        float dPencil1 = sdCapsule(pos, -PENCIL_POS - vec3(2.2,0.,0.), -PENCIL_POS-vec3(2.55, 0., 0.), .21);\n        if (dPencil1 < res.x) res = vec2(dPencil1, MAT_PENCIL_1);\n        float ax = abs(-2.25 - pos.x - PENCIL_POS.x);\n        float r = .02*abs(2.*fract(30.*pos.x)-1.)*smoothstep(.08,.09,ax)*smoothstep(.21,.2,ax);\n\n        float dPencil2 = sdCylinderZY(pos + PENCIL_POS + vec3(2.25,-0.0125,0), vec2(.22 - r,.25));\n        if (dPencil2 < res.x) res = vec2(dPencil2, MAT_PENCIL_2);\n    }\n    \n    //--- watch\n    if (watchIntersect) {\n        float dDial = sdCylinder(p1, vec2(1.05,.13));\n        if (dDial < res.x) res = vec2(dDial, MAT_DIAL);\n\n        float dC = sdTorusYX(vec3(max(abs(p1.x)-.5*p1.y-0.19,0.),p1.y+0.12,p1.z-1.18), vec2(0.11,0.02));\n        if (dC < res.x) res = vec2(dC, MAT_METAL_1);\n        \n        float dM = sdTorus(p1 + vec3(0,-.165,0), vec2(1.005,.026));   \n        float bb = sdCylinderXY(p1+vec3(0,0,-1.3), vec2(0.15,0.04));\n        if(bb < 0.5) {\n            float a = atan(p1.y, p1.x);\n            float c = abs(fract(a*3.1415)-.5);\n            float d = min(abs(p1.z-1.3), .02);\n            bb = sdCylinderXY(p1+vec3(0,0,-1.3), vec2(0.15 - 40.*d*d - .1*c*c,0.04));\n        } \n        dM = opU(dM, bb);\n         \n        dM = opU(dM, sdCylinderZY(p1+vec3(0,0,-1.18), vec2(0.06,0.2)));\n        float rr = min(abs(p1.z-1.26), .2);\n        dM = opU(dM, sdCylinderXY(p1+vec3(0,0,-1.2), vec2(0.025 + 0.35*rr,0.1)));\n       \n        p1.y = abs(p1.y);\n        dM = opU(dM, sdTorus(p1 + vec3(0,-.1,0), vec2(1.025,.075)));\n        dM = opU(dM, sdCylinder(p1, vec2(1.1,.1)));\n        dM = opS(sdTorus(p1 + vec3(0,-.1,0), vec2(1.11,.015)), dM);\n        dM = opU(dM, sdCylinder(p1, vec2(0.01,0.175)));\n        dM = opU(dM, sdCylinder(p1+vec3(0,0,.6), vec2(0.01,0.155)));\n        if (dM < res.x) res = vec2(dM, MAT_METAL_0);\n\n        // minutes hand\n        float dMin = mapHand(pm + vec3(0,-.16,0), .02, 0.7, 0.015);\n        if (dMin < res.x) res = vec2(dMin, MAT_HAND);\n        // hours hand\n        float dHour = mapHand(ph + vec3(0,-.15,0), .02, 0.4, 0.03);\n        if (dHour < res.x) res = vec2(dHour, MAT_HAND);\n        // seconds hand\n        float dSeconds = mapHand(ps + vec3(0,-.14,0), .01, 0.17, 0.006);\n        if (dSeconds < res.x) res = vec2(dSeconds, MAT_HAND);\n    }\n    \n    return res;\n}\n\nvec2 map( in vec3 pos ) {\n    vec3 p1 = rotateX( pos + vec3(0,-CLOCK_OFFSET_Y,0), CLOCK_ROT_X );\n    p1 = rotateY( p1, CLOCK_ROT_Y );\n    \n\tfloat secs = mod( floor(iDate.w),        60.0 );\n\tfloat mins = mod( floor(iDate.w/60.0),   60.0 );\n\tfloat hors = mod( floor(iDate.w/3600.0), 24.0 ) + mins/60.;\n    \n    vec3 ps = rotateY( p1+vec3(0,0,.6), 6.2831*secs/60.0 );\n    vec3 pm = rotateY( p1, 6.2831*mins/60.0 );\n    vec3 ph = rotateY( p1, 6.2831*hors/12.0 );\n    \n    return map( pos, p1, ps, pm, ph, true, true );\n}\n\nfloat mapGlass( in vec3 pos ) {\n    return sdEllipsoid( pos - vec3(0,.10,0), vec3(1.,.2,1.) );\n}\n\n//\n// Ray march code.\n//\n\nvec2 sphIntersect( in vec3 ro, in vec3 rd, in float r ) {\n\tvec3 oc = ro;\n\tfloat b = dot( oc, rd );\n\tfloat c = dot( oc, oc ) - r * r;\n\tfloat h = b*b - c;\n\tif( h<0.0 ) return vec2(-1.0);\n    h = sqrt( h );\n\treturn vec2(-b - h, -b + h);\n}\n\nbool boxIntserct( in vec3 ro, in vec3 rd, in vec3 rad ) {\n    vec3 m = 1.0/rd;\n    vec3 n = m*ro;\n    vec3 k = abs(m)*rad;\n\t\n    vec3 t1 = -n - k;\n    vec3 t2 = -n + k;\n\n\tfloat tN = max( max( t1.x, t1.y ), t1.z );\n\tfloat tF = min( min( t2.x, t2.y ), t2.z );\n\t\n\tif( tN > tF || tF < 0.0) return false;\n\n\treturn true;\n}\n\nvec3 calcNormal( in vec3 pos ) {\n    const vec2 e = vec2(1.0,-1.0)*0.0075;\n    return normalize( e.xyy*map( pos + e.xyy ).x + \n\t\t\t\t\t  e.yyx*map( pos + e.yyx ).x + \n\t\t\t\t\t  e.yxy*map( pos + e.yxy ).x + \n\t\t\t\t\t  e.xxx*map( pos + e.xxx ).x );\n}\n\nvec2 castRay( in vec3 ro, in vec3 rd ) {\n    float tmin = 0.5;\n    float tmax = MAX_T;\n    \n    // bounding volume\n    const float top = 0.95;\n    float tp1 = (0.0-ro.y)/rd.y; if( tp1>0.0 ) tmax = min( tmax, tp1 );\n    float tp2 = (top-ro.y)/rd.y; if( tp2>0.0 ) { if( ro.y>top ) tmin = max( tmin, tp2 );\n                                                 else           tmax = min( tmax, tp2 ); }\n    \n    float t = tmin;\n    float mat = -1.;\n    \n    vec3 p1 = rotateX( ro + vec3(0,-CLOCK_OFFSET_Y,0), CLOCK_ROT_X );\n    p1 = rotateY( p1, CLOCK_ROT_Y );\n    vec3 rd1 = rotateX( rd, CLOCK_ROT_X );\n    rd1 = rotateY( rd1, CLOCK_ROT_Y );\n    \n\tfloat secs = mod( floor(iDate.w),        60.0 );\n\tfloat mins = mod( floor(iDate.w/60.0),   60.0 );\n\tfloat hors = mod( floor(iDate.w/3600.0), 24.0 ) + mins/60.;\n    \n    vec3 ps = rotateY( p1+vec3(0,0,.6), 6.2831*secs/60.0 );\n    vec3 rds = rotateY( rd1, 6.2831*secs/60.0 );\n    \n    vec3 pm = rotateY( p1, 6.2831*mins/60.0 );\n    vec3 rdm = rotateY( rd1, 6.2831*mins/60.0 );\n    \n    vec3 ph = rotateY( p1, 6.2831*hors/12.0 );\n    vec3 rdh = rotateY( rd1, 6.2831*hors/12.0 );\n    \n    bool watchIntersect = boxIntserct(p1, rd1, vec3(1.1,.2,1.4));\n    bool pencilIntersect = boxIntserct(ro + PENCIL_POS, rd, vec3(3.,.23,.23));\n    \n    for( int i=0; i<48; i++ ) {\n\t    float precis = 0.00025*t;\n\t    vec2 res = map( ro+rd*t, p1+rd1*t, ps+rds*t, pm+rdm*t, ph+rdh*t, \n                       watchIntersect, pencilIntersect );\n        if( res.x<precis || t>tmax ) break; //return vec2(t, mat);\n        t += res.x;\n        mat = res.y;\n    }\n\n    if( t>tmax ) t=-1.0;\n    return vec2(t, mat);\n}\n\nvec3 calcNormalGlass( in vec3 pos ) {\n    const vec2 e = vec2(1.0,-1.0)*0.005;\n    return normalize( e.xyy*mapGlass( pos + e.xyy ) + \n\t\t\t\t\t  e.yyx*mapGlass( pos + e.yyx ) + \n\t\t\t\t\t  e.yxy*mapGlass( pos + e.yxy ) + \n\t\t\t\t\t  e.xxx*mapGlass( pos + e.xxx ) );\n}\n\nfloat castRayGlass( in vec3 ro, in vec3 rd ) {\n    vec3 p1 = rotateX( ro + vec3(0,-CLOCK_OFFSET_Y,0), CLOCK_ROT_X );\n    p1 = rotateY( p1, CLOCK_ROT_Y );\n    vec3 rd1 = rotateX( rd, CLOCK_ROT_X );\n    rd1 = rotateY( rd1, CLOCK_ROT_Y );\n\n    float t = -1.;\n    vec2 bb = sphIntersect( p1- vec3(0,.10,0), rd1, 1.);\n    if (bb.y > 0.) {\n        t = max(bb.x, 0.);\n        float tmax = bb.y;\n        for( int i=0; i<24; i++ ) {\n            float precis = 0.00025*t;\n            float res = mapGlass( p1+rd1*t );\n            if( res<precis || t>tmax ) break; \n            t += res;\n        }\n\n        if( t>tmax ) t=-1.0;\n    }\n    return t;\n}\n\n\nfloat calcAO( in vec3 ro, in vec3 rd ) {\n\tfloat occ = 0.0;\n    float sca = 1.0;\n    \n    vec3 p1 = rotateX( ro + vec3(0,-CLOCK_OFFSET_Y,0), CLOCK_ROT_X );\n    p1 = rotateY( p1, CLOCK_ROT_Y );\n    vec3 rd1 = rotateX( rd, CLOCK_ROT_X );\n    rd1 = rotateY( rd1, CLOCK_ROT_Y );\n    \n\tfloat secs = mod( floor(iDate.w),        60.0 );\n\tfloat mins = mod( floor(iDate.w/60.0),   60.0 );\n\tfloat hors = mod( floor(iDate.w/3600.0), 24.0 ) + mins/60.;\n    \n    vec3 ps = rotateY( p1+vec3(0,0,.6), 6.2831*secs/60.0 );\n    vec3 rds = rotateY( rd1, 6.2831*secs/60.0 );\n    \n    vec3 pm = rotateY( p1, 6.2831*mins/60.0 );\n    vec3 rdm = rotateY( rd1, 6.2831*mins/60.0 );\n    \n    vec3 ph = rotateY( p1, 6.2831*hors/12.0 );\n    vec3 rdh = rotateY( rd1, 6.2831*hors/12.0 );\n    \n    bool watchIntersect = true; //boxIntserct(p1, rd1, vec3(1.1,.2,1.4));\n    bool pencilIntersect = true; //boxIntserct(ro + PENCIL_POS, rd, vec3(3.,.23,.23));\n    \n    \n    for( int i=0; i<6; i++ ) {\n        float h = 0.001 + 0.25*float(i)/5.0;\n        float d = map( ro+rd*h, p1+rd1*h, ps+rds*h, pm+rdm*h, ph+rdh*h, \n                       watchIntersect, pencilIntersect ).x;\n        occ += (h-d)*sca;\n        sca *= 0.95;\n    }\n    return clamp( 1.0 - 1.5*occ, 0.0, 1.0 );    \n}\n\n//\n// Material properties.\n//\n\nvec4 texNoise( sampler2D sam, in vec3 p, in vec3 n ) {\n\tvec4 x = texture( sam, p.yz );\n\tvec4 y = texture( sam, p.zx );\n\tvec4 z = texture( sam, p.xy );\n\n\treturn x*abs(n.x) + y*abs(n.y) + z*abs(n.z);\n}\n\nvoid getMaterialProperties(\n    in vec3 pos, in float mat,\n    inout vec3 normal, inout vec3 albedo, inout float ao, inout float roughness, inout float metallic,\n\tsampler2D tex1, sampler2D tex2, sampler2D tex3) {\n    \n    vec3 pinv = rotateX( pos + vec3(0,-CLOCK_OFFSET_Y,0), CLOCK_ROT_X );\n    pinv = rotateY( pinv, CLOCK_ROT_Y );\n    \n    normal = calcNormal( pos );\n    ao = calcAO(pos, normal);\n    metallic = 0.;\n    \n    vec4 noise = texNoise(tex1, pinv * .5, normal);\n    float metalnoise = 1.- noise.r;\n    metalnoise*=metalnoise;\n\n    mat -= .5;\n    if (mat < MAT_TABLE) {\n        albedo = .7 * pow(texture(tex1, rotate(pos.xz * .4 + .25, -.3)).rgb, 2.2*vec3(0.45,0.5,0.5));\n        roughness = 0.95 - albedo.r * .6;\n    }\n    else if( mat < MAT_PENCIL_0 ) {\n        vec2 npos = pos.yz + PENCIL_POS.yz;\n        if (length(npos) < 0.055) {\n        \talbedo = vec3(0.02);\n        \troughness = .9;\n        } else if(sdHexPrism(pos + PENCIL_POS, vec2(.195, 3.)) < 0.) {\n        \talbedo = .8* texture(tex1, pos.xz).rgb;\n        \troughness = 0.99;\n        } else {\n        \talbedo = .5*pow(vec3(1.,.8,.15), vec3(2.2));\n        \troughness = .75 - noise.b * .4;\n        }\n        albedo *= noise.g * .75 + .7;\n    }\n    else if( mat < MAT_PENCIL_1 ) {\n       \talbedo = .4*pow(vec3(.85,.75,.55), vec3(2.2));\n       \troughness = 1.;\n    }\n    else if( mat < MAT_PENCIL_2 ) {\n        float ax = abs(-2.25 - pos.x - PENCIL_POS.x);\n        float r = 1. - abs(2.*fract(30.*pos.x)-1.)*smoothstep(.08,.09,ax)*smoothstep(.21,.2,ax);\n\n        r -= 4. * metalnoise;  \n        ao *= .5 + .5 * r;\n\t    albedo = mix(vec3(0.5, 0.3, 0.2),vec3(0.560, 0.570, 0.580), ao * ao); // Iron\n   \t\troughness = 1.-.25*r;\n   \t\tmetallic = 1.; \n    }\n    else if( mat < MAT_DIAL ) {\n        float dial = texture(tex2, vec2(-.5 * pinv.x + .5, +.5 * pinv.z + .5)).r;\n        albedo = vec3(dial);\n        roughness = dial + .95;\n    }\n    else if( mat < MAT_HAND ) {\n        albedo = vec3(0.02);\n        roughness = .65;\n    }\n    else if( mat < MAT_METAL_0 ) {\n\t    albedo = vec3(1.000, 0.766, 0.336); // Gold\n   \t\troughness = .6;\n   \t\tmetallic = 1.; \n    } \n    else if( mat < MAT_METAL_1 ) {\n\t    albedo = vec3(0.972, 0.960, 0.915); // Silver\n   \t\troughness = .7 + max(.15 * length(pos.xz)-.3, 0.); // prevent aliasing\n   \t\tmetallic = 1.; \n    }\n    \n    if (mat < MAT_PENCIL_2) {\n        ao = min(ao, smoothstep(.95, 1.5, length(pos.xz)));\n    }\n    \n    if (metallic > .5) {   \n        albedo *= 1.-metalnoise;\n        roughness += metalnoise*4.;\n    }\n    \n    ao = clamp(.1+.9*ao, 0., 1.);\n    roughness = clamp(roughness, 0., 1.);\n}\n\nmat3 setCamera( in vec3 ro, in vec3 ta ) {\n\tvec3 cw = normalize(ta-ro);\n\tvec3 cp = vec3(0.0, 1.0,0.0);\n\tvec3 cu = normalize( cross(cw,cp) );\n\tvec3 cv = normalize( cross(cu,cw) );\n    return mat3( cu, cv, cw );\n}\n",
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
                "id": "4dXGzr",
                "filepath": "/media/a/08b42b43ae9d3c0605da11d0eac86618ea888e62cdd9518ee8b9097488b31560.png",
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
                "id": "Xsf3Rr",
                "filepath": "/media/a/79520a3d3a0f4d3caa440802ef4362e99d54e12b1392973e4ea321840970a88a.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Old watch (IBL). Created by Reinder Nijhoff 2018\n// @reindernijhoff\n//\n// https://www.shadertoy.com/view/lscBW4\n//\n// In this buffer the albedo of the dial (red channel) and the roughness\n// of the glass (green channel) is pre-calculated.\n//\n\nbool resolutionChanged() {\n    return floor(texelFetch(iChannel0, ivec2(0), 0).r) != floor(iResolution.x);\n}\n\nfloat printChar(vec2 uv, uint char) {\n    float d = textureLod(iChannel1, (uv + vec2( char & 0xFU, 0xFU - (char >> 4))) / 16.,0.).a;\n\treturn smoothstep(1.,0., smoothstep(.5,.51,d));\n}\n\nfloat dialSub( in vec2 uv, float wr ) {\n    float r = length( uv );\n    float a = atan( uv.y, uv.x )+3.1415926;\n\n    float f = abs(2.0*fract(0.5+a*60.0/6.2831)-1.0);\n    float g = 1.0-smoothstep( 0.0, 0.1, abs(2.0*fract(0.5+a*12.0/6.2831)-1.0) );\n    float w = fwidth(f);\n    f = 1.0 - smoothstep( 0.2*g+0.05-w, 0.2*g+0.05+w, f );\n    float s = abs(fwidth(r));\n    f *= smoothstep( 0.9 - wr -s, 0.9 - wr, r ) - smoothstep( 0.9, 0.9+s, r );\n    float hwr = wr * .5;\n    f -= 1.-smoothstep(hwr+s,hwr,abs(r-0.9+hwr)) - smoothstep(hwr-s,hwr,abs(r-0.9+hwr));\n\n    return .1 + .8 * clamp(1.-f,0.,1.);\n}\n\nfloat dial(vec2 uv) {\n    float d = dialSub(uv, 0.05);\n\n    vec2 uvs = uv;\n    \n    uvs.y += 0.6;\n    uvs *= 1./(0.85-0.6);\n\n    d = min(d, dialSub(uvs, 0.1));\n    \n    vec2 center = vec2(0.5);\n    vec2 radius = vec2(3.65, 0.);\n    \n    for (int i=0; i<9; i++) {\n        if(i!=5) {\n\t        float a = 6.28318530718 * float(i+4)/12.;\n    \t    vec2 uvt = clamp(uv * 5. + center + rotate(radius, a), vec2(0), vec2(1));\n        \td = mix(d, 0.3, printChar(uvt, uint(49+i)));\n        }\n    }\n    for (int i=0; i<3; i++) {\n\t    float a = 6.28318530718 * float(i+13)/12.;\n    \tvec2 uvt1 = clamp(uv * 5. + center + rotate(radius, a) + vec2(.25,0.), vec2(0), vec2(1));\n        d = mix(d, 0.3, printChar(uvt1, uint(49)));\n    \tvec2 uvt = clamp(uv * 5. + center + rotate(radius, a)+ vec2(-.15,0.), vec2(0), vec2(1));\n        d = mix(d, 0.3, printChar(uvt, uint(48+i)));\n    }\n    \n    d *= .9 + .25*texture(iChannel2, uv*.5+.5).r;\n    \n    return pow(clamp(d, 0., 1.), 2.2);\n}\n\nfloat roughnessGlass(vec2 uv) {\n    uv = uv * .5 + .5;\n    return smoothstep(0.2, 0.8, texture(iChannel2, uv * .3).r) * .4 + .2;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {   \n    if(resolutionChanged() && iChannelResolution[1].x > 0.  && iChannelResolution[2].x > 0.) {\n        if (fragCoord.x < 1.5 && fragCoord.y < 1.5) {\n            fragColor = floor(iResolution.xyxy);\n        } else {\n            vec2 uv = (2.0*fragCoord.xy-iResolution.xy)/iResolution.xy;\n\n            fragColor = vec4( dial(uv), roughnessGlass(uv), 0., 1.0 );      \n        }\n    } else {\n        fragColor = texelFetch(iChannel0, ivec2(fragCoord), 0);\n    }\n}",
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
            "code": "// Old watch (IBL). Created by Reinder Nijhoff 2018\n// @reindernijhoff\n//\n// https://www.shadertoy.com/view/lscBW4\n//\n// In this buffer I pre-calculate the BRDF integration map, as described in:\n// http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf\n//\n\nconst float PI = 3.14159265359;\n\n// see: http://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf\nfloat PartialGeometryGGX(float NdotV, float a) {\n    float k = a / 2.0;\n\n    float nominator   = NdotV;\n    float denominator = NdotV * (1.0 - k) + k;\n\n    return nominator / denominator;\n}\n\nfloat GeometryGGX_Smith(float NdotV, float NdotL, float roughness) {\n    float a = roughness*roughness;\n    float G1 = PartialGeometryGGX(NdotV, a);\n    float G2 = PartialGeometryGGX(NdotL, a);\n    return G1 * G2;\n}\n\nfloat RadicalInverse_VdC(uint bits) {\n    bits = (bits << 16u) | (bits >> 16u);\n    bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);\n    bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);\n    bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);\n    bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);\n    return float(bits) * 2.3283064365386963e-10; // / 0x100000000\n}\n\nvec2 Hammersley(int i, int N) {\n    return vec2(float(i)/float(N), RadicalInverse_VdC(uint(i)));\n} \n\nvec3 ImportanceSampleGGX(vec2 Xi, float roughness) {\n    float a = roughness*roughness;\n    float phi      = 2.0 * PI * Xi.x;\n    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));\n    float sinTheta = sqrt(1.0 - cosTheta*cosTheta);\n\n    vec3 HTangent;\n    HTangent.x = sinTheta*cos(phi);\n    HTangent.y = sinTheta*sin(phi);\n    HTangent.z = cosTheta;\n\n    return HTangent;\n}\n\nvec2 IntegrateBRDF(float roughness, float NdotV) {\n    vec3 V;\n    V.x = sqrt(1.0 - NdotV*NdotV);\n    V.y = 0.0;\n    V.z = NdotV;\n\n    float A = 0.0;\n    float B = 0.0;\n\n    const int SAMPLE_COUNT = 128;\n\n    vec3 N = vec3(0.0, 0.0, 1.0);\n    vec3 UpVector = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);\n    vec3 TangentX = normalize(cross(UpVector, N));\n    vec3 TangentY = cross(N, TangentX);\n\n    for(int i = 0; i < SAMPLE_COUNT; ++i)  {\n        vec2 Xi = Hammersley(i, SAMPLE_COUNT);\n        vec3 HTangent = ImportanceSampleGGX(Xi, roughness);\n        \n        vec3 H = normalize(HTangent.x * TangentX + HTangent.y * TangentY + HTangent.z * N);\n        vec3 L = normalize(2.0 * dot(V, H) * H - V);\n\n        float NdotL = max(L.z, 0.0);\n        float NdotH = max(H.z, 0.0);\n        float VdotH = max(dot(V, H), 0.0);\n\n        if(NdotL > 0.0) {\n            float G = GeometryGGX_Smith(NdotV, NdotL, roughness);\n            float G_Vis = (G * VdotH) / (NdotH * NdotV);\n            float Fc = pow(1.0 - VdotH, 5.0);\n\n            A += (1.0 - Fc) * G_Vis;\n            B += Fc * G_Vis;\n        }\n    }\n    A /= float(SAMPLE_COUNT);\n    B /= float(SAMPLE_COUNT);\n    return vec2(A, B);\n}\n\nbool resolutionChanged() {\n    return floor(texelFetch(iChannel0, ivec2(0), 0).r) != floor(iResolution.x);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord ) {\n    if(resolutionChanged()) {\n        if (fragCoord.x < 1.5 && fragCoord.y < 1.5) {\n            fragColor = floor(iResolution.xyxy);\n        } else {\n\t   \t\tvec2 uv = fragCoord / iResolution.xy;\n    \t\tvec2 integratedBRDF = IntegrateBRDF(uv.y, uv.x);\n   \t \t\tfragColor = vec4(integratedBRDF, 0.0,1.0);\n        }\n    } else {\n        fragColor = texelFetch(iChannel0, ivec2(fragCoord), 0);\n    }\n}",
            "name": "Buffer B",
            "description": "",
            "type": "buffer"
          }
        ],
        "flags": {
          "mFlagVR": true,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": true,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "lscBW4",
          "date": "1525112497",
          "viewed": 17582,
          "name": "Old watch (IBL)",
          "username": "reinder",
          "description": "This shader uses Image Based Lighting (IBL) to render an old watch. The materials of the objects have physically-based properties. I have used the IBL technique as explained in the article 'Real Shading in Unreal Engine 4' by Brian Karis of Epic Games.",
          "likes": 257,
          "published": 3,
          "flags": 33,
          "usePreview": 1,
          "tags": [
            "lighting",
            "clock",
            "image",
            "ibl",
            "vr",
            "pbr",
            "watch",
            "based"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);