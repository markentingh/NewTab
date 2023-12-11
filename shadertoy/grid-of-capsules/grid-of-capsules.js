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
                "id": "XsX3Rn",
                "filepath": "/media/a/92d7758c402f0927011ca8d0a7e40251439fba3a1dac26f5b8b62026323501aa.jpg",
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
                "channel": 3,
                "type": "texture",
                "id": "XdX3Rn",
                "filepath": "/media/a/52d2a8f514c4fd2d9866587f4d7b2a5bfa1a11a0e772077d7682deb8b3b517e5.jpg",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Copyright Inigo Quilez, 2014 - https://iquilezles.org/\n// I am the sole copyright owner of this Work.\n// You cannot host, display, distribute or share this Work neither\n// as it is or altered, here on Shadertoy or anywhere else, in any\n// form including physical and digital. You cannot use this Work in any\n// commercial or non-commercial product, website or project. You cannot\n// sell this Work and you cannot mint an NFTs of it or train a neural\n// network with it without permission. I share this Work for educational\n// purposes, and you can link to it, through an URL, proper attribution\n// and unmodified screenshot, as part of your educational material. If\n// these conditions are too restrictive please contact me and we'll\n// definitely work it out.\n\n// Try 1, 2, 4, 8, 16 samples depending on how fast your machine is\n\n#if HW_PERFORMANCE==0\n#define VIS_SAMPLES 1\n#else\n#define VIS_SAMPLES 4\n#endif\n\n\nfloat hash1( vec2 n )\n{\n    return fract(sin(dot(n,vec2(1.0,113.0)))*43758.5453123);\n}\n\nfloat map( vec2 c ) \n{\n\treturn 20.0*textureLod( iChannel0, fract((c+0.5)/iChannelResolution[0].xy), 0.0 ).x;\n}\n\nvec3 calcNormal( in vec3 pos, in float id, float ic, in vec3 cen )\n{\n\tif( ic>2.5 ) return normalize(vec3(pos-cen));\n\tif( ic>1.5 ) return vec3(0.0,1.0,0.0);\n\treturn normalize((pos-cen)*vec3(1.0,0.0,1.0));\n}\n\nvec2 castRay( in vec3 ro, in vec3 rd, out vec2 oVos, out vec2 oDir )\n{\n\tvec2 pos = floor(ro.xz);\n\tvec2 ri = 1.0/rd.xz;\n\tvec2 rs = sign(rd.xz);\n\tvec2 ris = ri*rs;\n\tvec2 dis = (pos-ro.xz+ 0.5 + rs*0.5) * ri;\n\tfloat t = -1.0;\n\tfloat ic = 0.0;\n\t\n\tvec2 mm = vec2(0.0);\n\tfor( int i=0; i<450; i++ ) \n\t{\n\t\tfloat ma = map(pos);\n\t\tvec3  ce = vec3( pos.x+0.5, ma, pos.y+0.5 );\n\t\tvec3  rc = ro - ce;\n\t\t\n\t\t// cylinder\n\t\tfloat a = dot( rd.xz, rd.xz );\n\t\tfloat b = dot( rc.xz, rd.xz );\n\t\tfloat c = dot( rc.xz, rc.xz ) - 0.45*0.45;\n\t\tfloat h = b*b - a*c;\n\t\tif( h>=0.0 )\n\t\t{\n\t\t\tfloat t1 = (-b-sqrt(h))/a;\n\t\t\tif( t1>0.0 && (ro.y+t1*rd.y)<ma )\n\t\t\t{\n\t\t\t\tt = t1;\n\t\t\t\tic = 1.0;\n    \t\t\tbreak; \n\t\t\t}\n\n\t\t\t// sphere\n\t\t\tb = dot( rd, rc );\n\t\t\tc = dot( rc, rc ) - 0.45*0.45;\n\t\t\th = b*b - c;\n\t\t\tif( h>0.0 )\n\t\t\t{\n\t\t\t\tt = -b-sqrt(h);\n\t\t\t \tic = 3.0;\n\t\t\t \tbreak;\n\t\t\t}\n\t\t}\n\n\t\tmm = step( dis.xy, dis.yx ); \n\t\tdis += mm * ris;\n        pos += mm * rs;\n\t}\n\n\toDir = mm;\n\toVos = pos;\n\n\treturn vec2( t, ic );\n\n}\n\nfloat castVRay( in vec3 ro, in vec3 rd )\n{\n\tvec2 pos = floor(ro.xz);\n\tvec2 ri = 1.0/rd.xz;\n\tvec2 rs = sign(rd.xz);\n\tvec2 ris = ri*rs;\n\tvec2 dis = (pos-ro.xz+ 0.5 + rs*0.5) * ri;\n\tfloat res = 1.0;\n\t\n\tvec2 mm = step( dis.xy, dis.yx ); \n\tdis += mm * ris;\n    pos += mm * rs;\n\n\tfor( int i=0; i<48; i++ ) \n\t{\n\t\tfloat ma = map(pos);\n\t\tvec3  ce = vec3( pos.x+0.5, ma, pos.y+0.5 );\n\t\tvec3  rc = ro - ce;\n\t\t\n\t\tfloat a = dot( rd.xz, rd.xz );\n\t\tfloat b = dot( rc.xz, rd.xz );\n\t\tfloat c = dot( rc.xz, rc.xz ) - 0.45*0.45;\n\t\tfloat h = b*b - a*c;\n\t\tif( h>=0.0 )\n\t\t{\n\t\t\tfloat t = (-b - sqrt( h ))/a;\n\t\t\tif( (ro.y+t*rd.y)<ma )\n\t\t\t{\n\t\t\t\tres = 0.0;\n    \t\t\tbreak; \n\t\t\t}\n\t\t\tb = dot( rd, rc );\n\t\t\tc = dot( rc, rc ) - 0.45*0.45;\n\t\t\th = b*b - c;\n\t\t\tif( h>0.0 )\n\t\t\t{\n\t\t\t\tres = 0.0;\n\t\t\t \tbreak;\n\t\t\t}\t\t\t\n\t\t}\n\n\t\tmm = step( dis.xy, dis.yx ); \n\t\tdis += mm * ris;\n        pos += mm * rs;\n\t}\n\n\n\treturn res;\n}\n\nvec4 texcube( sampler2D sam, in vec3 p, in vec3 n )\n{\n\tvec4 x = texture( sam, p.yz );\n\tvec4 y = texture( sam, p.zx );\n\tvec4 z = texture( sam, p.xy );\n\treturn x*abs(n.x) + y*abs(n.y) + z*abs(n.z);\n}\n\nvec3 DirLight( in vec3 l, in vec3 ligColor,\n\t\t\t  \n\t\t\t   in vec3 n, in vec3 v,\n               in vec3 matColor, in float matR, \n\t\t\t   \n               in float sha )\n{\n\tvec3 h = normalize(v+l);\n\tvec3 r = reflect( -v, n );\n\n\tfloat nl = clamp(dot(n,l),0.0,1.0);\n\tfloat nv = clamp(dot(n,v),0.0,1.0);\n\tfloat nh = clamp(dot(n,h),0.0,1.0);\n    float hl = clamp(dot(h,l),0.0,1.0);\n\n    vec3 sunDiff = matColor * nl;\n\t\n\t//-------------------\n\n\tfloat fresnel = 0.04 + (1.0-0.04)*pow( 1.0-hl, 5.0 );\t\n\tfloat a = pow( 1024.0, 1.0-matR);\n\t\n\tfloat blinnPhong = ((6.0+a)/8.0) * pow( nh, a );\n\ta *= 0.2; blinnPhong += ((6.0+a)/8.0) * pow( nh, a );\n\tfloat k = 2.0/sqrt(3.1416*(a+2.0));\n\tfloat v1 = nl*(1.0-k)+k;\n\tfloat v2 = nv*(1.0-k)+k;\n\tvec3 sunSpec = 10.0*matColor * nl * fresnel * blinnPhong / (v1*v2);\n\t\n\t//-------------------\n\t\n    return ligColor * (sunDiff + sunSpec) * sha;\n}\n\nvec3 DomeColor( in vec3 rd )\n{\n\tfloat cho = max(rd.y,0.0);\n\treturn 4.0*mix( mix(vec3(0.07,0.12,0.23), \n\t\t\t\t        vec3(0.04,0.08,0.15), pow(cho,2.0)), \n                        vec3(0.26,0.30,0.36), pow(1.0-cho,16.0) );\n}\n\nvec4 CapsuleColor( in vec3 pos, in vec3 nor, in float hei, in float cid )\n{\n    vec4 mate = vec4(1.0);\n    mate.xyz = texture( iChannel3, vec2(0.5,0.04*hei), -100.0 ).xyz;\n    vec3 te = texcube( iChannel3, 0.4*pos+ 13.13*cid, nor ).xyz;\n\tmate.xyz *= 0.4 + 1.8*te.x;\n    mate.w = clamp(2.0*te.x*te.x,0.0,1.0);\n    mate.xyz *= 0.6;\n    mate.xyz *= 1.0 - 0.8*smoothstep(0.4,0.8,cid);\n    return mate;\n}\n\nfloat CalcOcclusion( in vec2 vos, in vec3 pos, in vec3 nor )\n{\n\tfloat occ  = nor.y*0.55;\n\tocc += 0.5*clamp( nor.x,0.0,1.0)*smoothstep( -0.5, 0.5, pos.y-map(vos+vec2( 1.0, 0.0)) );\n\tocc += 0.5*clamp(-nor.x,0.0,1.0)*smoothstep( -0.5, 0.5, pos.y-map(vos+vec2(-1.0, 0.0)) );\n\tocc += 0.5*clamp( nor.z,0.0,1.0)*smoothstep( -0.5, 0.5, pos.y-map(vos+vec2( 0.0, 1.0)) );\n\tocc += 0.5*clamp(-nor.z,0.0,1.0)*smoothstep( -0.5, 0.5, pos.y-map(vos+vec2( 0.0,-1.0)) );\n\tocc = 0.2 + 0.8*occ;\n\tocc *= pow( clamp((0.1+pos.y)/(0.1+map(floor(pos.xz))),0.0,1.0),2.0);\n\tocc = occ*0.5+0.5*occ*occ;\n    return occ;\n}\n\nvec3 path( float t )\n{\n    vec2 p  = 100.0*sin( 0.01*t*vec2(1.2,1.0) + vec2(0.1,1.1) );\n\t     p +=  50.0*sin( 0.02*t*vec2(1.1,1.3) + vec2(1.0,4.5) );\n\t\n\treturn vec3( p.x, 20.0 + 4.0*sin(0.05*t), p.y );\n}\n\nvec3 render( in vec3 ro, in vec3 rd )\n{\n\t\tvec3 bgcol = DomeColor( rd )*smoothstep(-0.1,0.1,rd.y);\n        vec3 col = bgcol;\n        \n\t\t// raymarch\t\n        vec2 vos, dir;\n\t\tvec2 res = castRay( ro, rd, vos, dir );;\n        float t = res.x;\n        if( t>0.0 )\n        {\n            vec3  pos = ro + rd*t;\n\t\t\tfloat cid = hash1( vos );\n\t\t\tfloat hei = map(vos);\n\t\t\tvec3  cen = vec3(vos.x+0.5, hei, vos.y+0.5 );\n\t\t\tvec3  nor = calcNormal( pos, cid, res.y, cen );\n\n            // material\t\t\t \n\t\t\tvec4 mate = CapsuleColor( pos, nor, hei, cid );\n\n            // lighting\n\t\t\tcol = vec3(0.0);\n\t\t\t\n\t\t\tfloat occ  = CalcOcclusion( vos, pos, nor );\n\n\t\t\t// key light\n\t\t\tvec3  lig = normalize(vec3(-0.7,0.24,0.6));\n\t\t\tfloat sha = castVRay( pos, lig );\n\t\t\tcol += DirLight( lig, 4.0*vec3(2.8,1.5,1.0), nor, -rd, mate.xyz, mate.w, sha );\n\t\t\t\n            // back light\t\t\t\n\t\t\tvec3  blig = normalize(vec3(-lig.x,0.0,-lig.z));\n            col += DirLight( blig, 1.5*vec3(0.9,0.8,0.7), nor, -rd, mate.xyz, 1.0, occ );\n\t\t\t\n            // dome/fill light\t\t\t\n\t        float sp = clamp(dot(-rd,nor),0.0,1.0);\n\t\t\tcol += sp*3.0*mate.xyz*occ*vec3(0.4,0.5,1.0)*smoothstep(0.0,1.0,reflect(rd,nor).y)*(0.3+0.7*sha);\n\t\t\tcol += sp*3.0*mate.xyz*occ*vec3(0.4,0.5,1.0)*smoothstep(-0.5,0.5,nor.y);\n\t\t\t\n\t\t\t// fog\t\t\t\n\t\t\tfloat ff = 1.0 - 0.8*smoothstep( 200.0, 400.0, t*1.4 );\n\t\t\tff *= exp( -pow(0.003*t,1.5) );\n            col = mix( bgcol, col, ff );\n\t\t}\n\n    return col;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    // inputs\t\n\tvec2 q = fragCoord.xy / iResolution.xy;\n\t\n    vec2 mo = iMouse.xy / iResolution.xy;\n    if( iMouse.w<=0.00001 ) mo=vec2(0.0);\n\t\t\n\t\n\t// montecarlo\t\n\tvec3 tot = vec3(0.0);\n    #if VIS_SAMPLES<2\n\tint a = 0;\n\t{\n\t\tvec4 rr = texture( iChannel1, (fragCoord.xy + 0.5+113.3137*float(a))/iChannelResolution[1].xy  ).xzyw;\n        vec2 p = (2.0*fragCoord-iResolution.xy) / iResolution.y;\n        float time = 75.0 + 6.0*iTime + 50.0*mo.x;\n    #else\n\tfor( int a=0; a<VIS_SAMPLES; a++ )\n\t{\n\t\tvec4 rr = textureLod( iChannel1, (fragCoord + float(iFrame)*vec2(17.0,31.0)+float(a)*vec2(113.0,37.0))/iChannelResolution[1].xy, 0.0  ).xzyw;\n        vec2 p = (2.0*(fragCoord+rr.wy-0.5)-iResolution.xy) / iResolution.y;\n        float time = 75.0 + 6.0*(iTime + 1.0*(0.5/24.0)*rr.x) + 50.0*mo.x;\n    #endif\t\n\n\t\t// camera\n        vec3 ro = path( time );\n        vec3 ta = path( time+5.0 ) - vec3(0.0,3.0,0.0);\n        float cr = 0.2*cos(0.1*time*0.25);\n\t\n        // build ray\n        vec3 ww = normalize( ta - ro);\n        vec3 uu = normalize(cross( vec3(sin(cr),cos(cr),0.0), ww ));\n        vec3 vv = normalize(cross(ww,uu));\n        float r2 = p.x*p.x*0.32 + p.y*p.y;\n        p *= (7.0-sqrt(37.5-11.5*r2))/(r2+1.0);\n        vec3 rd = normalize( p.x*uu + p.y*vv + 2.5*ww );\n\n        #if VIS_SAMPLES>4\n        // dof\n        vec3 fp = ro + rd * 25.0;\n        ro += (uu*(-1.0+2.0*rr.x) + vv*(-1.0+2.0*rr.w))*0.08;\n        rd = normalize( fp - ro );\n        #endif\n\n        vec3 col = render( ro, rd );\n        \n\t\ttot += col;\n\t}\n\ttot /= float(VIS_SAMPLES);\n\t\n\t// gamma\t\n\ttot = pow( clamp( tot, 0.0, 1.0 ), vec3(0.45) );\n\t\t\n\t// vignetting\t\n    tot *= 0.5 + 0.5*pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1 );\n\t\n\tfragColor = vec4( tot, 1.0 );\n}\n    \nvoid mainVR( out vec4 fragColor, in vec2 fragCoord, in vec3 fragRayOri, in vec3 fragRayDir )\n{\n    float time = 75.0 + 1.0*iTime;\n                             \n    vec3 ro = path( time );\n    \n    vec3 col = render( ro + fragRayOri + vec3(0.0,-1.0,0.0), fragRayDir );\n\n\tcol = pow( clamp( col, 0.0, 1.0 ), vec3(0.45) );\n\n    fragColor = vec4( col, 1.0 );\n}",
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
          "id": "XdfXDB",
          "date": "1406226235",
          "viewed": 15199,
          "name": "Grid of Capsules",
          "username": "iq",
          "description": "Pretty much the same as the Grid of Cylnders: , but with spheres on top.",
          "likes": 99,
          "published": 3,
          "flags": 1,
          "usePreview": 0,
          "tags": [
            "procedural",
            "3d",
            "raytracing",
            "grid",
            "regulargrid",
            "capsule"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);