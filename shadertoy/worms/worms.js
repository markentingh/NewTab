var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [],
            "code": "// Copyright Inigo Quilez, 2014 - https://iquilezles.org/\n// I am the sole copyright owner of this Work.\n// You cannot host, display, distribute or share this Work neither\n// as it is or altered, here on Shadertoy or anywhere else, in any\n// form including physical and digital. You cannot use this Work in any\n// commercial or non-commercial product, website or project. You cannot\n// sell this Work and you cannot mint an NFTs of it or train a neural\n// network with it without permission. I share this Work for educational\n// purposes, and you can link to it, through an URL, proper attribution\n// and unmodified screenshot, as part of your educational material. If\n// these conditions are too restrictive please contact me and we'll\n// definitely work it out.\n\n// You can buy a metal print of this shader here:\n// https://www.redbubble.com/i/metal-print/Worms-with-code-by-InigoQuilez/39863456.0JXQP\n\n\n#if HW_PERFORMANCE==0\n#define AA 1\n#else\n#define AA 2\n#endif\n\nfloat hash( vec2 p ) { return fract(sin(1.0+dot(p,vec2(127.1,311.7)))*43758.545); }\nvec2  sincos( float x ) { return vec2( sin(x), cos(x) ); }\nvec3  opU( vec3 d1, vec3 d2 ){ return (d1.x<d2.x) ? d1 : d2;}\n\nvec2 sdCylinder( in vec3 p )\n{\n    return vec2( length(p.xz), (p.y+50.0)/100.0 );\n}\n\nvec3 map( vec3 p )\n{\n    float time = iTime*1.0;\n    \n    vec2  id = floor( (p.xz+1.0)/2.0 );\n    float ph = hash(id+113.1);\n    float ve = hash(id);\n\n    p.xz = mod( p.xz+1.0, 2.0 ) - 1.0;\n    p.xz += 0.5*cos( 2.0*ve*time + (p.y+ph)*vec2(0.53,0.32) - vec2(1.57,0.0) );\n\n    vec3 p1 = p; p1.xz += 0.15*sincos(p.y-ve*time*ve+0.0);\n    vec3 p2 = p; p2.xz += 0.15*sincos(p.y-ve*time*ve+2.0);\n    vec3 p3 = p; p3.xz += 0.15*sincos(p.y-ve*time*ve+4.0);\n    \n    vec2 h1 = sdCylinder( p1 );\n    vec2 h2 = sdCylinder( p2 );\n    vec2 h3 = sdCylinder( p3 );\n\n    return opU( opU( vec3(h1.x-0.15*(0.8+0.2*sin(200.0*h1.y)), ve + 0.000, h1.y), \n                     vec3(h2.x-0.15*(0.8+0.2*sin(200.0*h2.y)), ve + 0.015, h2.y) ), \n                     vec3(h3.x-0.15*(0.8+0.2*sin(200.0*h3.y)), ve + 0.030, h3.y) );\n\n}\n\nvec3 intersect( in vec3 ro, in vec3 rd, in float px, const float maxdist )\n{\n    vec3 res = vec3(-1.0);\n    float t = 0.0;\n    for( int i=0; i<256; i++ )\n    {\n\t    vec3 h = map(ro + t*rd);\n        res = vec3( t, h.yz );\n        if( abs(h.x)<(px*t) || t>maxdist ) break;\n        t += min( h.x, 0.5 )*0.85;\n    }\n\treturn res;\n}\n\nvec3 calcNormal( in vec3 pos )\n{\n    const vec2 e = vec2(1.0,-1.0)*0.003;\n    return normalize( e.xyy*map( pos + e.xyy ).x + \n\t\t\t\t\t  e.yyx*map( pos + e.yyx ).x + \n\t\t\t\t\t  e.yxy*map( pos + e.yxy ).x + \n\t\t\t\t\t  e.xxx*map( pos + e.xxx ).x );\n}\n\nfloat calcOcc( in vec3 pos, in vec3 nor )\n{\n    const float h = 0.1;\n\tfloat ao = 0.0;\n    for( int i=0; i<8; i++ )\n    {\n        vec3 dir = sin( float(i)*vec3(1.0,7.13,13.71)+vec3(0.0,2.0,4.0) );\n        dir = dir + 2.0*nor*max(0.0,-dot(nor,dir));            \n        float d = map( pos + h*dir ).x;\n        ao += h-d;\n    }\n    return clamp( 1.0 - 0.7*ao, 0.0, 1.0 );\n}\n\nvec3 render( in vec3 ro, in vec3 rd, in float px )\n{\n    vec3 col = vec3(0.0);\n    \n    const float maxdist = 32.0;\n    vec3 res = intersect( ro, rd, px, maxdist );\n    if( res.x < maxdist )\n    {\n        vec3  pos = ro + res.x*rd;\n        vec3  nor = calcNormal( pos );\n        float occ = calcOcc( pos, nor );\n\n        col = 0.5 + 0.5*cos( res.y*30.0 + vec3(0.0,4.4,4.0) );\n        col *= 0.5 + 1.5*nor.y;\n        col += clamp(1.0+dot(rd,nor),0.0,1.0);\n        float u = 800.0*res.z - sin(res.y)*iTime;\n        col *= 0.95 + 0.05*cos( u + 3.1416*cos(1.5*u + 3.1416*cos(3.0*u)) + vec3(0.0,1.0,2.0) );\n        col *= vec3(1.5,1.0,0.7);\n        col *= occ;\n\n        float fl = mod( (0.5+cos(2.0+res.y*47.0))*iTime + res.y*7.0, 4.0 )/4.0;\n        col *= 2.5 - 1.5*smoothstep(0.02,0.04,abs(res.z-fl));\n        \n        col *= exp( -0.1*res.x );\n        col *= 1.0 - smoothstep( 20.0, 30.0, res.x );\n    }\n    \n    return pow( col, vec3(0.5,1.0,1.0) );\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\t\n    #define ZERO (min(iFrame,0))\n    \n    vec3 tot = vec3(0.0);\n#if AA>1\n    for( int m=ZERO; m<AA; m++ )\n    for( int n=ZERO; n<AA; n++ )\n    {\n        // pixel coordinates\n        vec2 o = vec2(float(m),float(n)) / float(AA) - 0.5;\n        vec2 p = (-iResolution.xy + 2.0*(fragCoord+o))/iResolution.y;\n#else\n        vec2 p = (-iResolution.xy + 2.0*fragCoord)/iResolution.y;\n#endif\n    \n        vec3  ro = vec3(0.6,2.4,1.2);\n        vec3  ta = vec3(0.0,0.0,0.0);\n        float fl = 3.0;\n        vec3  ww = normalize( ta - ro);\n        vec3  uu = normalize( cross( vec3(0.0,1.0,0.0), ww ) );\n        vec3  vv = normalize( cross(ww,uu) );\n        vec3  rd = normalize( p.x*uu + p.y*vv + fl*ww );\n\n        vec3 col = render( ro, rd, 1.0/(iResolution.y*fl) );\n \n        tot += col;\n#if AA>1\n    }\n    tot /= float(AA*AA);\n#endif\n\n    vec2 q = fragCoord.xy/iResolution.xy;\n    tot *= pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1 );\n    \n\tfragColor = vec4( tot, 1.0 );\n}\n\nvoid mainVR( out vec4 fragColor, in vec2 fragCoord, in vec3 fragRayOri, in vec3 fragRayDir )\n{\n    vec3 ro = fragRayOri + vec3( 1.0, 0.0, 1.0 );\n    vec3 rd = fragRayDir;\n    vec3 col = render( ro, rd, 0.001 );\n    \n\tfragColor = vec4( col, 1.0 );\n}",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": true,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": false,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "XsjXR1",
          "date": "1409134954",
          "viewed": 24855,
          "name": "Worms",
          "username": "iq",
          "description": "Pretty much inspired by nimitz's spiral shader (https://www.shadertoy.com/view/4sfXDs)",
          "likes": 259,
          "published": 3,
          "flags": 1,
          "usePreview": 0,
          "tags": [
            "procedural",
            "3d",
            "raymarching",
            "distancefield",
            "vr"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);