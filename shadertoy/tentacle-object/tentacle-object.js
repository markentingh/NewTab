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
            "code": "// Anti-aliasing samples count sqrt\n#define AA 2\n\nfloat time;\n\n// Rotation matrix for spherical layer.\nmat3 rot(float r)\n{\n    float t = time - r * 2.;\n    float s = .5 + .5 * r;\n    return rotX(cos(t / 1.5) * s) * rotY(sin(t / 3.) * s);\n}\n\n// Scene SDF\nfloat dist(vec3 p)\n{\n    const float precis = 35.0;\n\n    vec3 op = p;\n    \n    p = rot(length(p)) * p;\n    \n    // Rotational velocity estimation.\n    float diff = distance(p, rot(length(op) - 1e-2) * op);\n\n    // A scaling factor based on the rotational velocity to\n    // simulate a 'bunching up' of the tentacles when they are spinning fast.\n    float k = max(1e-3, 1. + diff * 1.);\n    \n    p *= k;\n    op *= k;\n    \n    vec3 q;\n    vec2 sf = inverseSF( normalize(p), precis, q ); \n    \n    q *= k;\n    \n    float d = length(p);\n    \n    // Alternating tentacle lengths based on spiral point ID.\n    float r3 = (mod(sf.x, 3.) < 1.) ? 1. : 1.45;\n    float r2 = r3 / k;\n\n    d = smax(sf.y - diff * 2.2 - .04 / dot(p, p), d - r3, 32. / 200.);\n        \n    // Add spheres at the ends of the tentacles using the unrotated\n    // sample space, to keep them spherical.\n    q = transpose(rot(r2 + .05)) * q;\n    d = smin(d,  length(op - q * r2) - .1, 32. / 200.);\n    \n    return min(d * .6 / k, .2);\n}\n\n// A special field which is only applied when extracing surface normals.\nfloat bump(vec3 p)\n{\n    p = rot(length(p)) * p;\n    float f = 0.;\n    // FBM\n    for(int i = 0; i < 3; ++i)\n    \tf += textureLod(iChannel0, p * exp2(float(i)), 0.).r / exp2(float(i) + 1.);\n    return f * (1. - smoothstep(1.3, 1.5, length(p))) * .5;\n}\n\nvec3 getNormal(vec3 p)\n{\n    // Here the epsilon used for scene normal extraction is larger than the detailed\n    // bump epsilon. The larger geometry epsilon results in a smoothing effect which helps\n    // to blend the bases of the tentacles together.\n    \n    const vec2 eps = vec2(1e-1, 0);\n    const vec2 eps2 = vec2(1e-3, 0);\n    return normalize(vec3(dist(p + eps.xyy) + bump(p + eps2.xyy) - dist(p - eps.xyy) - bump(p - eps2.xyy),\n                          dist(p + eps.yxy) + bump(p + eps2.yxy) - dist(p - eps.yxy) - bump(p - eps2.yxy),\n                          dist(p + eps.yyx) + bump(p + eps2.yyx) - dist(p - eps.yyx) - bump(p - eps2.yyx)));\n}\n\n// Pyramid waveform\nfloat tri(float x)\n{\n    return min(fract(x) * 2., 2. - 2. * fract(x));\n}\n\nvec3 render(vec2 fragCoord)\n{\n    // Jittered time sample for motionblur\n    time = iTime + texelFetch(iChannel1, ivec2(fragCoord * 2.) & 1023, 0).r * .025;\n    \n    vec3 fragColor = vec3(0);\n    \n    vec2 uv = fragCoord / iResolution.xy * 2. - 1.;\n    uv.x *= iResolution.x / iResolution.y;\n\n    vec3 ro = vec3(0, 0, 3), rd = normalize(vec3(uv, -1.8));\n\n    ro.y += sin(time / 4.) * .03;\n    ro.x += sin(time / 5.) * .03;\n    \n    // Clip to a bounding sphere\n    vec2 spheret = intersectSphere(ro, rd, vec3(0), 1.6);\n\n    // Background colour\n    vec3 bg = vec3(.75) * mix(vec3(.5, .5, 1.), vec3(1), .6) * (1. - smoothstep(0., 7., length(uv)));\n\n    if(spheret.x > spheret.y)\n        return bg;\n\n    float t = spheret.x;\n    float maxt = spheret.y;\n\n    // Raymarch\n    for(int i = 0; i < 80; ++i)\n    {\n        float d = dist(ro + rd * t);\n        if(abs(d) < 1e-4 || t > maxt)\n            break;\n        t += d;\n    }\n\n    if(t > maxt)\n    {\n        fragColor.rgb = bg;\n    }\n    else\n    {\n        vec3 rp = ro + rd * t;\n        vec3 n = getNormal(rp);\n        vec3 r = reflect(rd, n);\n        float l = length(rp);\n        float fr = clamp(1. - dot(n, -rd), 0., 1.);\n\n    \t// Apply some fake shadowing to the specular highlight and the backlight,\n        // by simulating a spherical occluder for the 'body' at the center of the object.\n        float bodyR = .5;\n        float cone = cos(atan(bodyR / l));\n\n        float specshad = 1. - smoothstep(-.1, .1, dot(r, normalize(vec3(0) - rp)) - cone) * 1.;\n        float specshad2 = 1. - smoothstep(-.3, .3, dot(r, normalize(vec3(0) - rp)) - cone) * 1.;\n\n        // Backlight / fake SSS\n        fragColor.rgb = bg * mix(vec3(.2, .5, 1.) / 2., vec3(1., .9, .8).bgr, specshad2 * pow(fr, .8));\n        \n        // Fake AO from center of body\n        fragColor.rgb *= vec3(pow(mix(.5 + .5 * dot(n, normalize(vec3(0) - rp)), 1., smoothstep(0., 1.5, l)), .5));\n        \n        // Slight AO / diffuse bleeding\n        fragColor.rgb *= mix(vec3(.75,1.,.75), vec3(1), smoothstep(0.1, .8, l));\n\n        vec3 c = fragColor.rgb;\n        \n        // Blue / green alternating pattern\n        fragColor.rgb = mix(c.bbb * vec3(.5,1.,.5), fragColor.rgb, smoothstep(.3, .7, tri(l * 4.)));\n        \n        // Yellow tips\n        fragColor.rgb = mix(fragColor.rgb, c.bbb * vec3(1,1,.5), smoothstep(1.4, 1.5, l));\n        \n        // Yellow tips self-illumination\n        fragColor.rgb += vec3(1,1,.4) * smoothstep(1.4, 1.5, l) * .11;\n\n        // Specular highlight\n        fragColor.rgb += specshad * .9 * smoothstep(.4, .7, dot(r, normalize(vec3(1)))) * fr;\n\n        // Mist\n        fragColor.rgb += vec3(mix(vec3(.5, .5, 1.), vec3(0), exp(-t / 25.)));\n    }\n\n    return fragColor;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    fragColor.rgb = vec3(0);\n    \n    // Anti-aliasing sample loop\n    for(int y = 0; y < AA; ++y)\n    \tfor(int x = 0; x < AA; ++x)\n        {\n\t\t\tfragColor.rgb += clamp(render(fragCoord + vec2(x, y) / float(AA)), 0., 1.);\n        }\n    \n    fragColor.rgb /= float(AA * AA);\n    \n    // Contrast\n    fragColor.rgb = (fragColor.rgb * 1.2 - .05);\n    \n    // Clamp, gamma, dither\n    fragColor.rgb = pow(clamp(fragColor.rgb, 0., 1.), vec3(1. / 2.2)) + texelFetch(iChannel1, ivec2(fragCoord) & 1023, 0).gba / 200.;\n}\n",
            "name": "Image",
            "description": "",
            "type": "image"
          },
          {
            "outputs": [],
            "inputs": [],
            "code": "\n// Spherical Fibonnacci points, as described by Benjamin Keinert, Matthias Innmann, \n// Michael Sanger and Marc Stamminger in their paper (below)\n\n//=================================================================================================\n// http://lgdv.cs.fau.de/uploads/publications/spherical_fibonacci_mapping_opt.pdf\n//=================================================================================================\nconst float PI  = 3.14159265359;\nconst float PHI = 1.61803398875;\n\n// Originally from https://www.shadertoy.com/view/lllXz4\n// Modified by fizzer to put out the vector q.\nvec2 inverseSF( vec3 p, float n, out vec3 outq ) \n{\n    float m = 1.0 - 1.0/n;\n    \n    float phi = min(atan(p.y, p.x), PI), cosTheta = p.z;\n    \n    float k  = max(2.0, floor( log(n * PI * sqrt(5.0) * (1.0 - cosTheta*cosTheta))/ log(PHI+1.0)));\n    float Fk = pow(PHI, k)/sqrt(5.0);\n    vec2  F  = vec2( round(Fk), round(Fk * PHI) ); // k, k+1\n\n    vec2 ka = 2.0*F/n;\n    vec2 kb = 2.0*PI*( fract((F+1.0)*PHI) - (PHI-1.0) );    \n    \n    mat2 iB = mat2( ka.y, -ka.x, \n                    kb.y, -kb.x ) / (ka.y*kb.x - ka.x*kb.y);\n    \n    vec2 c = floor( iB * vec2(phi, cosTheta - m));\n    float d = 8.0;\n    float j = 0.0;\n    for( int s=0; s<4; s++ ) \n    {\n        vec2 uv = vec2( float(s-2*(s/2)), float(s/2) );\n        \n        float i = round(dot(F, uv + c));\n        \n        float phi = 2.0*PI*fract(i*PHI);\n        float cosTheta = m - 2.0*i/n;\n        float sinTheta = sqrt(1.0 - cosTheta*cosTheta);\n        \n        vec3 q = vec3( cos(phi)*sinTheta, sin(phi)*sinTheta, cosTheta );\n        float squaredDistance = dot(q-p, q-p);\n        if (squaredDistance < d) \n        {\n            outq = q;\n            d = squaredDistance;\n            j = i;\n        }\n    }\n    return vec2( j, sqrt(d) );\n}\n\nvec2 intersectSphere(vec3 ro, vec3 rd, vec3 org, float rad)\n{\n   float a = dot(rd, rd);\n   float b = 2. * dot(rd, ro - org);\n   float c = dot(ro - org, ro - org) - rad * rad;\n   float desc = b * b - 4. * a * c;\n   if (desc < 0.)\n      return vec2(1, 0);\n\n   return vec2((-b - sqrt(desc)) / (2. * a), (-b + sqrt(desc)) / (2. * a));\n}\n\n// polynomial smooth min\n// from iq: https://iquilezles.org/articles/smin\nfloat smin( float a, float b, float k )\n{\n    float h = clamp( 0.5+0.5*(b-a)/k, 0.0, 1.0 );\n    return mix( b, a, h ) - k*h*(1.0-h);\n}\n\nfloat smax(float a,float b,float k){ return -smin(-a,-b,k);}\n\nmat3 rotX(float a)\n{\n    return mat3(1., 0., 0.,\n                0., cos(a), sin(a),\n                0., -sin(a), cos(a));\n}\n\nmat3 rotY(float a)\n{\n    return mat3(cos(a), 0., sin(a),\n                0., 1., 0.,\n                -sin(a), 0., cos(a));\n}\n\nmat3 rotZ(float a)\n{\n    return mat3(cos(a), sin(a), 0.,\n                -sin(a), cos(a), 0.,\n                0., 0., 1.);\n}\n",
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
          "id": "3tXXRn",
          "date": "1561725752",
          "viewed": 8710,
          "name": "Tentacle Object",
          "username": "fizzer",
          "description": "Some kind of tentacled object, made with IQ's implementation of the inverse spherical Fibonacci function from Keinert et al.",
          "likes": 240,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "orb",
            "tentacles",
            "jelly"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);