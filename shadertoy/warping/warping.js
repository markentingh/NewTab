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
            "code": "// Copyright Inigo Quilez, 2013 - https://iquilezles.org/\n// I am the sole copyright owner of this Work.\n// You cannot host, display, distribute or share this Work neither\n// as it is or altered, here on Shadertoy or anywhere else, in any\n// form including physical and digital. You cannot use this Work in any\n// commercial or non-commercial product, website or project. You cannot\n// sell this Work and you cannot mint an NFTs of it or train a neural\n// network with it without permission. I share this Work for educational\n// purposes, and you can link to it, through an URL, proper attribution\n// and unmodified screenshot, as part of your educational material. If\n// these conditions are too restrictive please contact me and we'll\n// definitely work it out.\n\n// See https://iquilezles.org/articles/warp for details\n\n\n#if HW_PERFORMANCE==0\n#define AA 1\n#else\n#define AA 2\n#endif\n\nfloat hash(vec2 p)  // replace this by something better\n{\n    p  = fract( p*0.6180339887 );\n    p *= 25.0;\n    return fract( p.x*p.y*(p.x+p.y) );\n}\n\n// consider replacing this by a proper noise function\nfloat noise( in vec2 x )\n{\n    vec2 p = floor(x);\n    vec2 f = fract(x);\n    f = f*f*(3.0-2.0*f);\n    float a = hash(p+vec2(0,0));\n\tfloat b = hash(p+vec2(1,0));\n\tfloat c = hash(p+vec2(0,1));\n\tfloat d = hash(p+vec2(1,1));\n    return mix(mix( a, b,f.x), mix( c, d,f.x),f.y);\n}\n\nconst mat2 mtx = mat2( 0.80,  0.60, -0.60,  0.80 );\n\nfloat fbm4( vec2 p )\n{\n    float f = 0.0;\n    f += 0.5000*(-1.0+2.0*noise( p )); p = mtx*p*2.02;\n    f += 0.2500*(-1.0+2.0*noise( p )); p = mtx*p*2.03;\n    f += 0.1250*(-1.0+2.0*noise( p )); p = mtx*p*2.01;\n    f += 0.0625*(-1.0+2.0*noise( p ));\n    return f/0.9375;\n}\n\nfloat fbm6( vec2 p )\n{\n    float f = 0.0;\n    f += 0.500000*noise( p ); p = mtx*p*2.02;\n    f += 0.250000*noise( p ); p = mtx*p*2.03;\n    f += 0.125000*noise( p ); p = mtx*p*2.01;\n    f += 0.062500*noise( p ); p = mtx*p*2.04;\n    f += 0.031250*noise( p ); p = mtx*p*2.01;\n    f += 0.015625*noise( p );\n    return f/0.96875;\n}\n\nvec2 fbm4_2( vec2 p )\n{\n    return vec2( fbm4(p+vec2(1.0)), fbm4(p+vec2(6.2)) );\n}\n\nvec2 fbm6_2( vec2 p )\n{\n    return vec2( fbm6(p+vec2(9.2)), fbm6(p+vec2(5.7)) );\n}\n\nfloat func( vec2 q, out vec2 o, out vec2 n )\n{\n    q += 0.05*sin(vec2(0.11,0.13)*iTime + length( q )*4.0);\n    \n    q *= 0.7 + 0.2*cos(0.05*iTime);\n\n    o = 0.5 + 0.5*fbm4_2( q );\n    \n    o += 0.02*sin(vec2(0.13,0.11)*iTime*length( o ));\n\n    n = fbm6_2( 4.0*o );\n\n    vec2 p = q + 2.0*n + 1.0;\n\n    float f = 0.5 + 0.5*fbm4( 2.0*p );\n\n    f = mix( f, f*f*f*3.5, f*abs(n.x) );\n\n    f *= 1.0-0.5*pow( 0.5+0.5*sin(8.0*p.x)*sin(8.0*p.y), 8.0 );\n\n    return f;\n}\n\nfloat funcs( in vec2 q )\n{\n    vec2 t1, t2;\n    return func(q,t1,t2);\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec3 tot = vec3(0.0);\n#if AA>1\n    for( int mi=0; mi<AA; mi++ )\n    for( int ni=0; ni<AA; ni++ )\n    {\n        // pixel coordinates\n        vec2 of = vec2(float(mi),float(ni)) / float(AA) - 0.5;\n        vec2 q = (2.0*(fragCoord+of)-iResolution.xy)/iResolution.y;\n#else    \n        vec2 q = (2.0*fragCoord-iResolution.xy)/iResolution.y;\n#endif\n\n        vec2 o, n;\n        float f = func(q, o, n);\n        \n        vec3 col = vec3(0.2,0.1,0.4);\n        col = mix( col, vec3(0.3,0.05,0.05), f );\n        col = mix( col, vec3(0.9,0.9,0.9), dot(n,n) );\n        col = mix( col, vec3(0.5,0.2,0.2), 0.5*o.y*o.y );\n        col = mix( col, vec3(0.0,0.2,0.4), 0.5*smoothstep(1.2,1.3,abs(n.y)+abs(n.x)) );\n        col *= f*2.0;\n\n        vec2 ex = vec2( 1.0 / iResolution.x, 0.0 );\n        vec2 ey = vec2( 0.0, 1.0 / iResolution.y );\n        #if AA>1\n        ex /= float(AA);\n        ey /= float(AA);\n        #endif\n        vec3 nor = normalize( vec3( funcs(q+ex) - f, ex.x, funcs(q+ey) - f ) );\n        \n        vec3 lig = normalize( vec3( 0.9, -0.2, -0.4 ) );\n        float dif = clamp( 0.3+0.7*dot( nor, lig ), 0.0, 1.0 );\n\n        vec3 lin  = vec3(0.85,0.90,0.95)*(nor.y*0.5+0.5);\n             lin += vec3(0.15,0.10,0.05)*dif;\n\n        col *= lin;\n        col = vec3(1.0)-col;\n        col = col*col;\n        col *= vec3(1.2,1.25,1.2);\n        \n        tot += col;\n#if AA>1\n    }\n    tot /= float(AA*AA);\n#endif\n    \n\tvec2 p = fragCoord / iResolution.xy;\n\ttot *= 0.5 + 0.5 * sqrt(16.0*p.x*p.y*(1.0-p.x)*(1.0-p.y));\n\t\n\tfragColor = vec4( tot, 1.0 );\n}",
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
          "id": "4s23zz",
          "date": "1382867080",
          "viewed": 32801,
          "name": "Warping - procedural 1",
          "username": "iq",
          "description": "Warp. Tutorial here: [url]https://iquilezles.org/articles/warp[/url].",
          "likes": 394,
          "published": 3,
          "flags": 0,
          "usePreview": 1,
          "tags": [
            "procedural",
            "2d",
            "fbm"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);