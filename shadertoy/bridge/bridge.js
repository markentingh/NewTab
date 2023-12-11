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
                "id": "4dXGRn",
                "filepath": "/media/a/10eb4fe0ac8a7dc348a2cc282ca5df1759ab8bf680117e4047728100969e7b43.jpg",
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
                "channel": 2,
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
            "code": "// Copyright Inigo Quilez, 2013 - https://iquilezles.org/\n// I am the sole copyright owner of this Work.\n// You cannot host, display, distribute or share this Work neither\n// as it is or altered, here on Shadertoy or anywhere else, in any\n// form including physical and digital. You cannot use this Work in any\n// commercial or non-commercial product, website or project. You cannot\n// sell this Work and you cannot mint an NFTs of it or train a neural\n// network with it without permission. I share this Work for educational\n// purposes, and you can link to it, through an URL, proper attribution\n// and unmodified screenshot, as part of your educational material. If\n// these conditions are too restrictive please contact me and we'll\n// definitely work it out.\n\n// Uncomment the following define in order to see the bridge in 3D!\n//#define STEREO\n\n//----------------------------------------------------------------\n\n// https://iquilezles.org/articles/distfunctions\nfloat sdBox( vec3 p, vec3 b )\n{\n  vec3 d = abs(p) - b;\n  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));\n}\n\n// https://iquilezles.org/articles/distfunctions\nfloat sdCone( vec3 p, vec2 c )\n{\n    float q = length(p.xz);\n    return max( dot(c,vec2(q,p.y)), p.y );\n}\n\n// https://iquilezles.org/articles/distfunctions\nfloat sdSphere( in vec3 p, in vec4 e )\n{\n\tvec3 di = p - e.xyz;\n\treturn length(di) - e.w;\n}\n\n//----------------------------------------------------------------\n\n// https://iquilezles.org/articles/smin\nvec2 smin( vec2 a, vec2 b )\n{\n    const float k = 1.6;\n\tfloat h = clamp( 0.5 + 0.5*(b.x-a.x)/k, 0.0, 1.0 );\n\treturn mix( b, a, h ) - k*h*(1.0-h);\n}\n\n//----------------------------------------------------------------\n\nfloat noise( in vec2 x )\n{\n    vec2 p = floor(x);\n    vec2 f = fract(x);\n\tvec2 uv = p.xy + f.xy*f.xy*(3.0-2.0*f.xy);\n\treturn -1.0 + 2.0*textureLod( iChannel2, (uv+0.5)/256.0, 0.0 ).x;\n}\n\n// https://iquilezles.org/articles/biplanar\nvec3 texturize( sampler2D sa, vec3 p, vec3 n )\n{\n\tvec3 x = texture( sa, p.yz ).xyz;\n\tvec3 y = texture( sa, p.zx ).xyz;\n\tvec3 z = texture( sa, p.xy ).xyz;\n\treturn x*abs(n.x) + y*abs(n.y) + z*abs(n.z);\n}\n\n//----------------------------------------------------------------\n\nfloat bridge( in vec3 pos )\n{\n    float f = 0.5-0.5*cos(3.14159*pos.z/20.0);\n\n    vec3 xpos = vec3( pos.x, 1.0-6.0+pos.y + f*4.0, pos.z );\n\n    float g = 0.5+0.5*xpos.x/4.0;\n    g = 1.0 - (smoothstep( 0.15, 0.25, g )-smoothstep( 0.75, 0.85, g ));\n    vec3 xpos5 = vec3( xpos.x, xpos.y + 10.0*f*f*g, xpos.z );\n\n    float mindist = sdBox(xpos5, vec3(4.0,0.5 + 10.0*f*f*g,20.0)-0.1  )-0.1;\n\n    float dis = sdBox( xpos, vec3(4.2,0.1,20.0) );\n    mindist = min( dis, mindist );\n\t\n    vec3 sxpos = vec3( abs(xpos.x), xpos.y, xpos.z );\n    dis = sdBox( sxpos-vec3(4.0-0.4,1.5,0.0), vec3(0.4,0.2,20.0)-0.05 )-0.05;\n    mindist = min( dis, mindist );\n\n    if( abs(xpos.z)<20.0 )\n    {\n        int cid = int(floor( xpos.z ));\n        if( cid == 0 || cid==14 || cid==-14 )\n        {\n            vec3 xpos2 = vec3( abs(xpos.x)-3.4, xpos.y-1.0, mod(1000.0+xpos.z,1.0)-0.5 );\n\n            dis = sdBox( xpos2, vec3(0.8,1.0,0.45) );\n            mindist = min( dis, mindist );\n\t\t\t\n            dis = sdBox( xpos2+vec3(-0.8,0.0,0.0), vec3(0.15,0.9,0.35) );\n            mindist = max( mindist, -dis );\n\n            dis = sdSphere( xpos2, vec4(0.0, 1.3, 0.0, 0.35 ) );\n            mindist = min( dis, mindist );\n        }\n        else\n        {\n            vec3 xpos2 = vec3( abs(xpos.x)-(4.0-0.2), xpos.y-0.8, mod(1000.0+xpos.z,1.0)-0.5 );\n            vec3 xposc = vec3( length( xpos2.xz ), xpos2.y, 0.0 );\n\n            float mo = 0.8 + 0.2*cos(2.0*6.2831*xpos2.y);\n\n            float ma = cos(4.0*atan(xpos2.x,xpos2.z));\n            mo -= 0.1*(1.0-ma*ma);\n\n            dis = sdBox( xposc, vec3(0.2*mo,0.5,0.0)  );\n            mindist = min( dis, mindist );\n        }\n    }\n\n    return 0.25*mindist;\n}\n\n\nfloat terrain( vec2 x )\n{\n\tvec2 z = x*0.05;\n\t\n\tx *= 0.06*1.0; x += 227.3;\n\t\n\tvec2 p = floor(x);\n    vec2 f = fract(x);\n\n    f = f*f*(3.0-2.0*f);\n    float a = textureLod(iChannel1,(p+vec2(0.5,0.5))/1024.0,0.0).x;\n\tfloat b = textureLod(iChannel1,(p+vec2(1.5,0.5))/1024.0,0.0).x;\n\tfloat c = textureLod(iChannel1,(p+vec2(0.5,1.5))/1024.0,0.0).x;\n\tfloat d = textureLod(iChannel1,(p+vec2(1.5,1.5))/1024.0,0.0).x;\n\tfloat r = mix(mix( a, b,f.x), mix( c, d,f.x), f.y);\n\n    r -= 0.04*(noise( 5.0*z ));\n\t\n\tr = r*15.0 + 5.0;\n\tfloat ss = smoothstep( 0.5, 2.2, abs(z.y) );\n\tr = mix( r, -3.0, 1.0-ss );\n\t\n\tfloat cc = 1.0-smoothstep( 0.1, 1.0, abs(z.x) );\n\tcc *= smoothstep( 0.5, 1.0, abs(z.y) );\n\tr = mix( r, 0.5, cc );\n\n\treturn r;\n}\n\nfloat trees( vec3 p )\n{\n    vec2 ip = floor( p.xz/4.0 );\n\tvec2 fp = mod(   p.xz,4.0 );\n\n    float d = 4.0+p.y;\n    \n    for( int j=-1; j<=1; j++ )\n    for( int i=-1; i<=1; i++ )\n    {\n        vec2 off = vec2(i,j);\n        vec2 iq = ip + off;\n        vec2 q = iq*4.0;\n        \n        float e = smoothstep( 0.4, 0.6, texelFetch(iChannel1,(ivec2(iq)*4)&1023, 0).x );\n        e *= smoothstep( 23.0, 24.0, -q.y );\n        if( e<0.001 ) continue;\n\n        vec2 ce = vec2(2.0) + 1.0*(1.0-2.0*texelFetch(iChannel2,ivec2(iq)&255, 0 ).xy);\n\n        ce += off*4.0;\n        \n        float h = terrain( q+ce );\n        \n        float dc = sdCone( vec3(fp.x,p.y,fp.y)-vec3(ce.x,h+6.0*e,ce.y), vec2(0.98,0.199) );\n        dc += 0.1*sin(6.0*p.y)*sin(8.0*atan(fp.x-ce.x,fp.y-ce.y));\n\n        d = min( d, dc );\n\n    }\n    return d;\n}\n\nvec2 map( in vec3 p )\n{\n    vec2 res = vec2(1000.0,-1.0);\n\n\t// terrain\n\tfloat h = terrain( p.xz );\n\tfloat dd = (p.y - h);\n\t\t\n\tres = vec2( 0.75*dd, 0.0 );\n\n\n    // bridge\n    float bd = sdBox(p,vec3(10.0,8.0,25.0)); // bounding volume\n    if( bd<res.x )    \n    {\n\tfloat dis = bridge( p );\n\tres = smin( res, vec2(dis,1.0) );\n    }\n\t\n    // water\n    {\n    float dis = p.y - (-2.0);\t\n\tif( dis<res.x ) res = vec2( dis, 2.0 );\n    }\n\n    // trees\t\n    bd = p.z-23.0;\n    if( bd<res.x )\n    {\n\tfloat dis = trees(p);\n\tif( dis<res.x ) res = vec2( dis, 0.0 );\n    }\n\n    return res;\n}\n\nconst float precis = 0.015;\n\nvec3 raycast( in vec3 ro, in vec3 rd )\n{\n\tfloat maxd = 250.0;\n    float tp = (25.0-ro.y)/rd.y;\n    if( tp>0.0 ) maxd = min(maxd,tp);\n    float t = 0.0;\n\tfloat d = 0.0;\n    float m = 1.0;\n    for( int i=0; i<256; i++ )\n    {\n\t    vec2 res = map( ro+rd*t );\n        if( abs(res.x)<precis||t>maxd ) break;\n\t\td = res.y;\n\t\tm = res.y;\n        t += res.x*0.9;\n    }\n\n    if( t>maxd ) m=-1.0;\n    return vec3( t, d, m );\n}\n\n// https://iquilezles.org/articles/normalsSDF\nvec3 calcNormal( in vec3 pos )\n{\n    vec2 e = vec2(1.0,-1.0)*0.5773*precis;\n    return normalize( e.xyy*map( pos + e.xyy ).x + \n\t\t\t\t\t  e.yyx*map( pos + e.yyx ).x + \n\t\t\t\t\t  e.yxy*map( pos + e.yxy ).x + \n\t\t\t\t\t  e.xxx*map( pos + e.xxx ).x );\n}\n\n// https://iquilezles.org/articles/rmshadows\nfloat softshadow( in vec3 ro, in vec3 rd, float k )\n{\n    float res = 1.0;\n    float t = 0.0;\n\tfloat h = 1.0;\n\n    float maxd = 250.0;\n    float tp = (25.0-ro.y)/rd.y;\n    if( tp>0.0 ) maxd = min(maxd,tp);\n\n    for( int i=0; i<60; i++ )\n    {\n        h = map(ro + rd*t).x;\n        res = min( res, k*h/t );\n\t\tt += clamp( h, 0.02, 1.0 );\n\t\tif( h<0.001 || t>maxd) break;\n    }\n    return clamp(res,0.0,1.0);\n}\n\nfloat calcOcc( in vec3 pos, in vec3 nor )\n{\n\tfloat totao = 0.0;\n    for( int aoi=0; aoi<8; aoi++ )\n    {\n        float hr = 0.1 + 1.5*pow(float(aoi)/8.0,2.0);\n        vec3 aopos = pos + nor * hr;\n        float dd = map( aopos ).x;\n        //totao += clamp( (hr-dd)*0.1-0.01,0.0,1.0);\n\t\ttotao += max( 0.0, hr-3.0*dd-0.01);\n    }\n    return clamp( 1.0 - 0.15*totao, 0.0, 1.0 );\n}\n\nconst vec3 lig = normalize(vec3(-0.5,0.25,-0.3));\n\nvoid shade( in vec3 pos, in vec3 nor, in vec3 rd, in float matID, \n\t\t    out vec3 bnor, out vec4 mate, out vec2 mate2 )\n{\n    bnor = vec3(0.0);\n\tmate = vec4(0.0);\n\tmate2 = vec2(0.0);\n\t\t\n\tif( matID<0.5 )\n    {\n        mate.xyz = vec3(0.1,0.2,0.0)*0.5;\n        mate.w = 0.0;\n    }\n    else if( matID<1.5 )\n    {\n        mate.xyz = 0.3*pow( texturize( iChannel0, 0.45*pos, nor ).xyz, vec3(2.0) );\n        mate.w = 0.0;\n    }\n    else if( matID<2.5 )\n    {\n        mate.w = 1.0;\n        float h = clamp( (pos.y - terrain(pos.xz))/10.0, 0.0, 1.0 );\n\t\t\t\n        mate.xyz = 0.3*mix( vec3(0.1,0.4,0.2), vec3(0.1,0.2,0.3), h );\n\t\t\t\n\t\tbnor = vec3(0.0,1.0,0.0);\n\t    bnor.xz  = 0.20*(-1.0 + 2.0*texture( iChannel2, 0.05*pos.xz*vec2(1.0,0.3) ).xz);\n\t    bnor.xz += 0.15*(-1.0 + 2.0*texture( iChannel2, 0.10*pos.xz*vec2(1.0,0.3) ).xz);\n\t    bnor.xz += 0.10*(-1.0 + 2.0*texture( iChannel2, 0.20*pos.xz*vec2(1.0,0.3) ).xz);\n\t\tbnor = 10.0*normalize(bnor);\n    }\n\telse //if( matID<3.5 )\n    {\n\t\tmate = vec4(0.0);\n\t}\n\t\n\tif( matID<2.5 )\n\t{\n\tfloat iss = smoothstep( 0.5, 0.9, nor.y );\n    iss = mix( iss, 0.9, 0.75*smoothstep( 0.1, 1.0, texturize( iChannel1, 0.1*pos, nor ).x ) );\n\t\n\tvec3 scol = vec3( 0.8 );\n\t\n\tvec3 cnor = normalize( -1.0 + 2.0*texture( iChannel2, 0.15*pos.xz ).xyz );\n\tcnor.y = abs( cnor.y );\n\tfloat spe = max( 0.0, pow( clamp( dot(lig,reflect(rd,cnor)), 0.0, 1.0), 16.0 ) );\n    mate2.y = spe*iss;\n\t\n    mate.xyz = mix( mate.xyz, scol, iss );\n\t}\n}\n\nfloat cloudShadow( in vec3 pos )\n{\n\tvec2 cuv = pos.xz + lig.xz*(100.0-pos.y)/lig.y;\n\tfloat cc = 0.1 + 0.9*smoothstep( 0.1, 0.35, textureLod( iChannel1, 0.0003*cuv + 0.1+0.013*iTime, 0.0 ).x );\n\t\n\treturn cc;\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n\tvec2 q = fragCoord.xy / iResolution.xy;\n    vec2 p = -1.0 + 2.0 * q;\n    p.x *= iResolution.x/iResolution.y;\n    vec2 m = vec2(0.5);\n\tif( iMouse.z>0.0 ) m = iMouse.xy/iResolution.xy;\n\n\t#ifdef STEREO\n\tfloat eyeID = mod(fragCoord.x + mod(fragCoord.y,2.0),2.0);\n    #endif\n\n    //-----------------------------------------------------\n    // animate\n    //-----------------------------------------------------\n\n\tfloat ctime = iTime;\n\n    //-----------------------------------------------------\n    // camera\n    //-----------------------------------------------------\n\n\tfloat an = sin(5.3+0.05*ctime) - 6.2831*(m.x-0.5);\n\n\tvec3 ro = vec3(30.0*sin(an),4.5,30.0*cos(an));\n    vec3 ta = vec3(2.0,1.0,0.0);\n\n    // camera matrix\n    vec3 ww = normalize( ta - ro );\n    vec3 uu = normalize( cross(ww,vec3(0.0,1.0,0.0) ) );\n    vec3 vv = normalize( cross(uu,ww));\n\n\t// create view ray\n\tvec3 rd = normalize( p.x*uu + p.y*vv + 2.5*ww );\n\n\t#ifdef STEREO\n\tvec3 fo = ro + rd*100.0; // put focus plane behind Mike\n\tro -= 0.5*uu*eyeID;    // eye separation\n\trd = normalize(fo-ro);\n    #endif\n\n    //-----------------------------------------------------\n\t// render\n    //-----------------------------------------------------\n\n\tvec3 col = 2.5*vec3(0.18,0.33,0.45) - rd.y*1.5;\n\tcol *= 0.9;\n    float sun = clamp( dot(rd,lig), 0.0, 1.0 );\n\tcol += vec3(2.0,1.5,0.0)*0.8*pow( sun, 32.0 );\n\n    vec3 bgcol = col;\n\t\n\tvec2 cuv = ro.xz + rd.xz*(100.0-ro.y)/rd.y;\n\tfloat cc = texture( iChannel1, 0.0003*cuv +0.1+ 0.013*iTime ).x;\n\tcc = 0.65*cc + 0.35*texture( iChannel1, 0.0003*2.0*cuv + 0.013*.5*iTime ).x;\n\tcc = smoothstep( 0.3, 1.0, cc );\n\tcol = mix( col, vec3(1.0,1.0,1.0)*(0.95+0.20*(1.0-cc)*sun), 0.7*cc );\n\t\n\t// raymarch\n    vec3 tmat = raycast(ro,rd);\n    if( tmat.z>-0.5 )\n    {\n        // geometry\n        vec3 pos = ro + tmat.x*rd;\n        vec3 nor = calcNormal(pos);\n\n        // materials\n\t\tvec4 mate = vec4(0.0);\n\t\tvec2 mate2 = vec2(0.0);\n\t\tvec3 bnor = vec3(0.0);\n\t\tshade( pos, nor, rd, tmat.z, bnor, mate, mate2 );\n        nor = normalize( nor + bnor );\n\n\t\tvec3 ref = reflect( rd, nor );\n\n\t\t// lighting\n\t\tfloat occ = calcOcc(pos,nor) * clamp(0.7 + 0.3*nor.y,0.0,1.0);\n        float sky = 0.6 + 0.4*nor.y;\n\t\tfloat bou = clamp(-nor.y,0.0,1.0);\n\t\tfloat dif = max(dot(nor,lig),0.0);\n        float bac = max(0.2 + 0.8*dot(nor,normalize(vec3(-lig.x,0.0,-lig.z))),0.0);\n\t\tfloat sha = 0.0; if( dif>0.01 ) sha=softshadow( pos+0.01*nor, lig, 64.0 );\n\t\tsha *= cloudShadow( pos );\n        float fre = pow( clamp( 1.0 + dot(nor,rd), 0.0, 1.0 ), 3.0 );\n\n\t\t// lights\n\t\tvec3 lin = vec3(0.0);\n\t\tlin += 1.0*dif*vec3(1.70,1.15,0.70)*pow(vec3(sha),vec3(1.0,1.2,2.0));\n\t\tlin += 1.0*sky*vec3(0.05,0.20,0.45)*occ;\n\t\tlin += 1.0*bac*vec3(0.20,0.25,0.25)*occ;\n\t\tlin += 1.2*bou*vec3(0.15,0.20,0.20)*(0.5+0.5*occ);\n        lin += 1.0*fre*vec3(1.00,1.25,1.30)*occ*0.5*(0.5+0.5*dif*sha);\n\t\tlin += 1.0*mate2.y*vec3(1.00,0.60,0.50)*4.0*occ*dif*(0.1+0.9*sha);\n\n\t\t// surface-light interacion\n\t\tcol = mate.xyz*lin;\n\n\t\t// fog\n\t\tcol = mix( bgcol, col, exp(-0.0015*pow(tmat.x,1.0)) );\n\t}\n\n\t// sun glow\n    col += vec3(1.0,0.6,0.2)*0.4*pow( sun, 4.0 );\n\n\t//-----------------------------------------------------\n\t// postprocessing\n    //-----------------------------------------------------\n    // gamma\n\tcol = pow( clamp(col,0.0,1.0), vec3(0.45) );\n\n    // contrast, desat, tint and vignetting\t\n\tcol = col*0.8 + 0.2*col*col*(3.0-2.0*col);\n\tcol = mix( col, vec3(col.x+col.y+col.z)*0.333, 0.25 );\n\tcol *= vec3(1.0,1.02,0.96);\n\tcol *= 0.6 + 0.4*pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.1 );\n\n    #ifdef STEREO\n    col *= vec3( eyeID, 1.0-eyeID, 1.0-eyeID );\n\t#endif\n\n    fragColor = vec4( col, 1.0 );\n}",
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
          "id": "Mds3z2",
          "date": "1375174454",
          "viewed": 18651,
          "name": "Bridge",
          "username": "iq",
          "description": "Reused an old bridge model I had and made an environment for it (\"first snot of the season\" sort of environment). As usual, it's all pretty rushed and certainly very hacked.",
          "likes": 164,
          "published": 3,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "3d",
            "raymarching",
            "distancefield",
            "procedueal"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);