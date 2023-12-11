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
                  "filter": "linear",
                  "wrap": "clamp",
                  "vflip": "true",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Copyright Inigo Quilez, 2019 - https://iquilezles.org/\n// I am the sole copyright owner of this Work.\n// You cannot host, display, distribute or share this Work neither\n// as it is or altered, here on Shadertoy or anywhere else, in any\n// form including physical and digital. You cannot use this Work in any\n// commercial or non-commercial product, website or project. You cannot\n// sell this Work and you cannot mint an NFTs of it or train a neural\n// network with it without permission. I share this Work for educational\n// purposes, and you can link to it, through an URL, proper attribution\n// and unmodified screenshot, as part of your educational material. If\n// these conditions are too restrictive please contact me and we'll\n// definitely work it out.\n\n// This is an experiment on creating a terrain using only sphere\n// SDFs, without using noise, displacement or heightmaps. Instead\n// the terrain is a true volumetric SDF; no approximations and no\n// reduced marching steps needed, even for concave areas.\n//\n// The article that explains this technique can be found here:\n//\n//     https://iquilezles.org/articles/fbmsdf\n//\n// A video render can be found here:\n//\n//     https://www.youtube.com/watch?v=mCdlfdpN-AM\n//\n// A subtractive synthesis example of this technique, here: \n//\n//     https://www.shadertoy.com/view/3dGSWR\n\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    vec3 col = texelFetch( iChannel0, ivec2(fragCoord), 0 ).xyz;\n\n    // grading\n    col = max(col*1.4-0.17,0.0);\n    col.y *= 1.04;\n    col.z += 0.01;\n\n    // vignette\n    vec2 p = fragCoord/iResolution.xy;\n    col *= 0.5 + 0.5*pow( 16.0*p.x*p.y*(1.0-p.x)*(1.0-p.y), 0.1 );\n         \n    // cheap dithering\n    col += sin(fragCoord.x*114.0)*sin(fragCoord.y*211.1)/512.0;\n    \n    fragColor = vec4( col, 1.0 );\n}\n",
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
                "id": "Xsf3zn",
                "filepath": "/media/a/f735bee5b64ef98879dc618b016ecf7939a5756040c2cde21ccb15e69a6e1cfb.png",
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
            "code": "// Created by inigo quilez - iq/2019\n// I share this piece (art and code) here in Shadertoy and through its Public API, only for educational purposes. \n// You cannot use, sell, share or host this piece or modifications of it as part of your own commercial or non-commercial product, website or project.\n// You can share a link to it or an unmodified screenshot of it provided you attribute \"by Inigo Quilez, @iquilezles and iquilezles.org\". \n// If you are a teacher, lecturer, educator or similar and these conditions are too restrictive for your needs, please contact me and we'll work it out.\n\n\n//#define USE_SUN_LIGHT \n#define USE_REPROJECTION\n#define USE_RAYDIFFS\n\n// https://iquilezles.org/articles/smin\nfloat smin( float a, float b, float k )\n{\n    float h = max(k-abs(a-b),0.0);\n    return min(a, b) - h*h*0.25/k;\n}\n\n// https://iquilezles.org/articles/smin\nfloat smax( float a, float b, float k )\n{\n    float h = max(k-abs(a-b),0.0);\n    return max(a, b) + h*h*0.25/k;\n}\n\n// https://iquilezles.org/articles/fbmsdf\nfloat sph( vec3 i, vec3 f, vec3 c )\n{\n    // random radius at grid vertex i+c (please replace this hash by\n    // something better if you plan to use this for a real application)\n    vec3  p = 17.0*fract( (i+c)*0.3183099+vec3(0.11,0.17,0.13) );\n    float w = fract( p.x*p.y*p.z*(p.x+p.y+p.z) );\n    float r = 0.7*w*w;\n    // distance to sphere at grid vertex i+c\n    return length(f-c) - r; \n}\n\n// https://iquilezles.org/articles/fbmsdf\nfloat sdBase( in vec3 p )\n{\n    vec3 i = floor(p);\n    vec3 f = fract(p);\n    return min(min(min(sph(i,f,vec3(0,0,0)),\n                       sph(i,f,vec3(0,0,1))),\n                   min(sph(i,f,vec3(0,1,0)),\n                       sph(i,f,vec3(0,1,1)))),\n               min(min(sph(i,f,vec3(1,0,0)),\n                       sph(i,f,vec3(1,0,1))),\n                   min(sph(i,f,vec3(1,1,0)),\n                       sph(i,f,vec3(1,1,1)))));\n}\n\n// https://iquilezles.org/articles/fbmsdf\nvec2 sdFbm( in vec3 p, in float th, in float d )\n{\n    // rotation and 2x scale matrix\n    const mat3 m = mat3( 0.00,  1.60,  1.20,\n                        -1.60,  0.72, -0.96,\n                        -1.20, -0.96,  1.28 );\n    vec3  q = p;\n    float t = 0.0;\n\tfloat s = 1.0;\n    const int ioct = 11;\n    for( int i=0; i<ioct; i++ )\n    {\n        if( d>s*0.866 ) break; // early exit\n        if( s<th ) break;      // lod\n        \n        float n = s*sdBase(q);\n        n = smax(n,d-0.1*s,0.3*s);\n        d = smin(n,d      ,0.3*s);\n        q = m*q;\n        s = 0.415*s;\n\n        t += d; \n        q.z += -4.33*t*s; // deform things a bit\n    }\n    return vec2( d, t );\n}    \n\n// https://iquilezles.org/articles/intersectors\nfloat sphIntersect( in vec3 ro, in vec3 rd, in vec4 sph )\n{\n\tvec3 oc = ro - sph.xyz;\n\tfloat b = dot( oc, rd );\n\tfloat c = dot( oc, oc ) - sph.w*sph.w;\n\tfloat h = b*b - c;\n\treturn -b + sqrt( h );\n}\n\n// https://iquilezles.org/articles/filteringrm\nvoid calcDpDxy( in vec3 ro, in vec3 rd, in vec3 rdx, in vec3 rdy, in float t, in vec3 nor, out vec3 dpdx, out vec3 dpdy )\n{\n    dpdx = t*(rdx*dot(rd,nor)/dot(rdx,nor) - rd);\n    dpdy = t*(rdy*dot(rd,nor)/dot(rdy,nor) - rd);\n}\n\n// https://iquilezles.org/articles/dontflip/dontflip.htm\nvec3 refVector( in vec3 v, in vec3 n )\n{\n    float k = dot(v,n);\n    return (k>0.0) ? v : v-2.0*n*k;\n}\n\n// https://iquilezles.org/articles/fbm\nfloat fbm( in vec2 p )\n{\n    float f = 0.0;\n    float s = 0.5;\n    for( int i=0; i<9; i++ )\n    {\n        float n = texture(iChannel1,p).x;\n        f += s*n;\n        p *= 2.01*mat2(4.0,-3.0,3.0,4.0)/5.0;\n        s *= 0.55;\n    }\n    return f;\n}\n\nmat3 setCamera( in vec3 ro, in vec3 ta, float cr )\n{\n\tvec3 cw = normalize(ta-ro);\n\tvec3 cp = vec3(0.0, cos(cr),sin(cr));\n\tvec3 cu = normalize( cross(cw,cp) );\n\tvec3 cv = normalize( cross(cu,cw) );\n    return mat3( cu, cv, cw );\n}\n\n//=========================================\n\nconst float precis = 0.0005;\n\nfloat gLakeHei = 0.03;\n\nvec2 map( in vec3 p, in float dis )\n{\n    // ground\n    float d = length(p-vec3(0.0,-250.0,0.0))-250.0;\n    \n    // terrain\n    vec2 dt = sdFbm( p, dis*precis, d );\n        \n    // lakes\n    float dp = p.y-gLakeHei;\n    dp = max( dp, length(p.xz)-5.0);\n    if( dp<dt.x ) { dt.y=-abs(dp-dt.x+0.00001*sin(iTime)); dt.x=dp; }\n    \n    return dt;\n}\n\nvec3 raycast( in vec3 ro, in vec3 rd )\n{\n    float tmin = 0.0;\n    float tmax = 15.0;\n    \n    // bounding plane    \n    #if 1\n    float tp = (0.25-ro.y)/rd.y;\n    if( tp>0.0 )\n    {\n        if( ro.y<0.25 ) tmax = min(tmax,tp);\n        else tmin = max(tmin,tp);\n\t}\n    #endif\n\n    // raymarch\n    float t = tmin;\n    vec2 h = vec2(0.0,0.0);\n\tfor( int i=0; i<512; i++ )\n\t{\n        vec3 pos = ro + t*rd;\n\t\th = map( pos, t );\n        if( abs(h.x)<(precis*t) || t>tmax ) break;\n\t\tt += h.x   * 1.5; // overstepping\n\t}\n\n\treturn (t<tmax) ? vec3(t,abs(h.y),(h.y<0.0)?2.0:1.0) : vec3(-1.0);\n}\n\n// https://iquilezles.org/articles/normalsSDF\nvec3 calcNormal( in vec3 pos, in float t )\n{\n    vec2 e = vec2(1.0,-1.0)*0.5773*precis*t;\n    return normalize( e.xyy*map( pos + e.xyy, t ).x + \n\t\t\t\t\t  e.yyx*map( pos + e.yyx, t ).x + \n\t\t\t\t\t  e.yxy*map( pos + e.yxy, t ).x + \n\t\t\t\t\t  e.xxx*map( pos + e.xxx, t ).x );\n}\n\n// https://iquilezles.org/articles/rmshadows\nfloat calcSoftShadow(vec3 ro, vec3 rd, float tmin, float tmax, float w, float dis)\n{\n    // bounding volume    \n    #if 1\n    float tp = (0.25-ro.y)/rd.y;\n    if( tp>0.0 )\n    {\n        //if( ro.y<0.25 ) \n        tmax = min(tmax,tp);\n        //else tmin = max(tmin,tp);\n\t}\n    #endif\n    \n    float minStep = clamp(0.025*dis,0.005,0.05);\n    \n    float t = tmin;\n    float res = 1.0;\n    for( int i=0; i<256; i++ )\n    {\n     \tfloat h = map(ro + t*rd, 50.0*t).x;\n        res = min( res, h/(w*t) );\n    \tt += max(h*t, minStep);\n        if( res<-1.0 || t>tmax ) break;\n        \n    }\n    res = max(res,-1.0);\n    return 0.25*(1.0+res)*(1.0+res)*(2.0-res); // smoothstep, in [-1,1]\n}\n\n// https://iquilezles.org/articles/rmshadows\nfloat calcSoftShadow2(vec3 ro, vec3 rd, float tmin, float tmax, float w, float dis)\n{\n    // bounding volume    \n    #if 1\n    float tp = (0.25-ro.y)/rd.y;\n    if( tp>0.0 )\n    {\n        //if( ro.y<0.25 ) \n        tmax = min(tmax,tp);\n        //else tmin = max(tmin,tp);\n\t}\n    #endif\n    \n    float minStep = clamp(0.025*dis,0.005,0.05);\n    \n    float t = tmin;\n    float res = 1.0;\n    for( int i=0; i<256; i++ )\n    {\n     \tfloat h = map(ro + t*rd, 50.0*t).x;\n        res = min( res, h/(w*t) );\n    \tt += max(h*t, minStep);\n        if( res<0.0 || t>tmax ) break;\n        \n    }\n    res = max(res,0.0);\n    return res*res*(3.0-2.0*res);\n}\n\n// https://iquilezles.org/www/material/nvscene2008/nvscene2008.htm\nconst float X4 = 1.1673039782614187; const vec4  H4 = vec4(  1.0/X4, 1.0/(X4*X4), 1.0/(X4*X4*X4), 1.0/(X4*X4*X4*X4) );\nfloat calcOcclusion( in vec3 pos, in vec3 nor )\n{\n    float kk; vec3 kk2;\n\tfloat ao = 0.0;\n    float off = textureLod(iChannel1,gl_FragCoord.xy/256.0,0.0).x;\n    vec4 k = vec4(0.7012912,0.3941462,0.8294585,0.109841)+off+iTime*0.1;\n    for( int i=0; i<8; i++ )\n    {\n\t\tk = fract(k + H4);\n        vec3 ap = normalize(-1.0+2.0*k.xyz);\n        float h = k.w*0.0015;\n        ap = (nor+ap)*h;\n        float d = map( pos+ap, 1.0 ).x;\n        ao += max(0.0,h-d)*1024.0;\n        if( ao>8.0 ) break;\n    }\n\tao /= 8.0;\n    return clamp( 1.0-ao, 0.0, 1.0 );\n}\n\n// https://iquilezles.org/articles/fog\nvec3 fog( in vec3 col, float t )\n{\n     vec3 fo = exp2(-1.0*t*vec3(0.8,1.0,1.4));\n     col *= fo;\n     col += 0.18*(1.0-fo)*(1.0-fo)*vec3(0.8,1.1,1.6);\n     return col;\n}\n\nvoid sceneSetup( out vec3 ro, out vec3 ta, out float cr, out float fl,\n                 out float rtime,\n                 in float time )\n{\n    time = mod( time, 75.0 );\n    if( time<15.0 )\n    {\n        rtime = time - 0.0;\n\n        float an = 0.0035*rtime-0.05;\n        ro = vec3( -1.5+an, 0.21, 0.1+an*0.7 );\n        ta = vec3( -1.7, -0.04, 0.7 );\n        fl = 2.5;\n        cr = -0.02;\n        gLakeHei = 0.0075;\n        ta += 0.001*sin(1.8*rtime*vec3(1.0,1.1,1.3)+vec3(0,2,4));\n    }\n    else if( time<30.0 )\n    {\n        rtime = time - 15.0;\n        float an = 0.002*rtime;\n        ta = vec3( 1.5+an, -0.17, 1.5 );\n        ro = ta + vec3( 1.0, 0.3, 0.0 );\n        fl = 2.5;\n        cr = 0.01*sin(rtime*0.1);\n        gLakeHei = -0.01;\n        ta += 0.002*sin(1.8*rtime*vec3(1.0,1.1,1.3)+vec3(0,2,4));\n    }\n    else if( time<45.0 )\n    {\n        rtime = time - 30.0;\n        float an = -0.001*rtime+2.0;\n        ro = 2.4*vec3( cos(an), 0.09, sin(an) );\n        ta = vec3( 0.0, -0.3, 0.0 );\n        fl = 3.5;\n        cr = 0.0;\n        gLakeHei = 0.03;\n        ta += 0.005*sin(1.8*rtime*vec3(1.0,1.1,1.3)+vec3(0,2,4));\n    }\n    else if( time<60.0 )\n    {\n        rtime = time - 45.0;\n    \tfloat an = 0.015*rtime;\n        ta = vec3( 1.0, -0.2, 1.5 );\n        ro = vec3( 2.7-an, 0.2-an*0.05, 1.8-0.3*an );\n    \tfl = 3.0;\n        cr = 0.1*sin(an);\n        gLakeHei = 0.03;\n        ta += 0.002*sin(1.8*rtime*vec3(1.0,1.1,1.3)+vec3(0,2,4));    \n    }\n    else //if( time<75.0 )\n    {\n        rtime = time - 60.0;\n        float an = 0.01*rtime;\n        ro = vec3( 2.8+cos(an), 0.32, -0.2+sin(an) );\n        ta = vec3( 2.8, 0.05, -0.2 );\n        fl = 6.0;\n        cr = 0.0;\n        gLakeHei = 0.03;\n        ta += 0.001*sin(1.8*rtime*vec3(1.0,1.1,1.3)+vec3(0,2,4));\n    }\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\n    #ifdef USE_REPROJECTION\n    int  fr = iFrame & 63; \n    vec2 of = vec2(fr&7,fr>>3)/8.0 - 0.5;\n    of += 0.5*sin(iTime+vec2(0,1))/8.0;\n    #else\n    vec2 of = vec2(0.0);\n    #endif\n    \n    vec2 p = (2.0*(fragCoord+of)-iResolution.xy)/ iResolution.y;\n\n    float time = iTime;\n\n\t// scene setup\n    vec3 ro, ta;\n    float cr, fl, fad;\n\tsceneSetup( ro, ta, cr, fl, fad, time );\n    \n    // camera matrix\t\n    mat3 ca = setCamera( ro, ta, cr );\n    vec3 rd = ca * normalize( vec3(p.xy,fl));\n    #ifdef USE_RAYDIFFS\n    // ray differentials\n    vec2 px = (-iResolution.xy+2.0*(fragCoord.xy+vec2(1.0,0.0)))/iResolution.y;\n    vec2 py = (-iResolution.xy+2.0*(fragCoord.xy+vec2(0.0,1.0)))/iResolution.y;\n    vec3 rdx = normalize( ca * vec3(px,fl) );\n    vec3 rdy = normalize( ca * vec3(py,fl) );\n    vec3 drddx = rdx - rd;\n    vec3 drddy = rdy - rd;\n    #endif\n    \n    // render\n    \n    // sky\n    vec3 col = vec3(0.32,0.34,0.4)*0.8;\n    // clouds\n    {\n      float tc = sphIntersect( ro, rd, vec4(0.0,-19.0,0.0,20.0) );\n      vec3 uv = ro + rd*tc;\n      float nn = fbm(uv.xz*0.001);\n      nn = smoothstep(0.5,0.9,nn);\n      col = mix(col,vec3(0.02,0.1,0.2)*0.8,nn*exp2(-0.05*tc));\n    }\n    // horizon\n    col += 0.06*exp2(-48.0*max(rd.y,0.0) );\n    \n    // terrain\n    vec3 tom = raycast( ro, rd );\n    float t = tom.x;\n    if( t>0.0 )\n    {\n        vec3 pos = ro + t*rd;\n        // https://iquilezles.org/articles/normalsSDF\n        vec3 nor = calcNormal( pos, t );\n        // https://iquilezles.org/articles/dontflip/dontflip.htm                \n        nor = refVector(nor,-rd);\n        // https://iquilezles.org/articles/filteringrm\n        #ifdef USE_RAYDIFFS\n        vec3 dposdx = t*drddx;\n        vec3 dposdy = t*drddy;\n        calcDpDxy( ro, rd, rdx, rdy, t, nor, dposdx, dposdy );\n        #endif\n\n        // add waves to lakes\n        float waves = smoothstep(0.3,0.35,texture(iChannel2,pos.xz*0.1).x);\n        if( tom.z>1.5 )\n        {\n        nor.xz += (0.3+0.7*waves)*0.05*(-1.0+2.0*texture(iChannel2,pos.xz*2.0*vec2(7.0,1.0)).xy);\n        nor = normalize(nor);            \n        }\n                \n        float occ = 1.0;\n        vec3  ref = reflect(rd,nor);\n        float fre = clamp(1.0+dot(nor,rd),0.0,1.0);\n        float roc = calcOcclusion(pos+nor*0.0001,nor);\n\n        // material\n        vec3 mate; float ks;\n \n        #ifdef USE_RAYDIFFS\n        vec3 te1 = textureGrad(iChannel2,1.0*pos.xz,1.0*dposdx.xz,1.0*dposdy.xz).xyz;\n        vec3 te2 = textureGrad(iChannel2,6.0*pos.xz,6.0*dposdx.xz,6.0*dposdy.xz).xyz;\n        #endif\n        // terrain\n        if( tom.z<1.5 ) \n        {\n            tom.y = smoothstep(0.0,0.1,tom.y);\n            occ = 0.3 + 0.7*tom.y;\n        \n            float ff = smoothstep(0.0,0.006,abs(gLakeHei-pos.y));\n\n            vec3 soil = 0.15*vec3(0.8,0.4,0.15);\n            #ifndef USE_RAYDIFFS\n            vec3 te1 = texture( iChannel2, pos.xz ).xyz;\n            #endif\n            soil += 0.1*te1;\n            mate = mix( soil*0.7, vec3(0.05), tom.y );\n            mate = mix( vec3(0.02), mate, ff );\n            ks = 0.2+tom.y*te1.x+0.5*(1.0-ff);\n\n            // grass\n            float grass = ff*smoothstep(0.9+0.05*tom.y,1.0,nor.y);\n            mate = mix( mate, 0.7*vec3(0.075,0.055,0.01)+0.1*vec3(1.2,1.1,0.9)*fre*fre*fre, grass);\n            ks *= 1.0-0.95*grass;\n\n            // texture\n            #ifndef USE_RAYDIFFS\n            vec3 te2 = texture(iChannel2,6.0*pos.xz).xyz;\n            #endif\n            mate *= te2*2.0;\n            ks *= te2.x*2.0;\n            \n            mate *= 0.5+0.5*ff;\n            ks += 0.1*(1.0-ff);\n        }\n        // water\n        else\n        {\n            mate = vec3(0.1,0.125,0.13)*0.1;\n            ks = 0.4;\n            roc = 0.9+0.1*roc;\n            ks *= 0.95+0.05*(1.0-waves);\n            // deph based hue\n            mate += 0.1*vec3(0.0,0.1,0.12)*exp2(-1024.0*tom.y);\n            // foam\n            mate += 0.02*(1.0-smoothstep(0.0,0.0002,tom.y-0.05*nor.x));\n        }\n\n\n        // lighting\n        col = vec3(0.0);\n\n        // sky\n        {\n        float dif = clamp(0.5+0.5*nor.y,0.0,1.0);\n        float bsha = roc*(0.5+occ);\n        if( bsha>0.001 ) bsha *= 0.75+0.25*calcSoftShadow2(pos+nor*0.0001, vec3(0,1,0), 0.001, 1.0, 0.12, t);\n        dif *= bsha;\n        col += mate*0.5*vec3(0.8,0.9,1.0)*dif;\n        float spe = roc*ks*(0.04+0.96*pow(fre,5.0))*smoothstep(-0.15,-0.1,ref.y);\n        if(spe>0.001 ) spe *= calcSoftShadow(pos+nor*0.00001, ref, 0.0001, 1.0, 0.015, t);\n        col += 0.5*spe*vec3(0.8,0.9,1.0);\n        }\n\n        #ifdef USE_SUN_LIGHT\n        // sun\n        {\n        col *= 0.75;\n        vec3 lig = normalize(vec3(-0.5,0.3,-1.1));\n        float dif = dot(lig,nor);\n        if( dif>0.0 )\n        dif *= calcSoftShadow(pos+nor*0.0001,lig,0.001,1.0,0.003, t);\n        dif = max(dif,0.0);\n        col += mate*dif*vec3(1.3,1.1,0.7)*0.5;\n        vec3 hal =normalize(lig-rd);\n        col += ks*vec3(1.2)*pow(clamp(dot(nor,hal),0.0,1.0),4.0)*dif*(0.04+0.96*pow(clamp(1.0-dot(hal,lig),0.0,1.0),5.0));\n        }\n        #endif        \n\n        col *= 4.5;\n               \n        col = fog(col,t);\n    }\n\telse\n    {\n        t = 1000.0;\n    }\n\n\n    // gamma\n    col = clamp(col,0.0,1.0);\n    col = pow(col,vec3(0.4545));\n    \n    // color grading\n    col = col*col*(3.0-2.0*col);\n\n    //------------------------------------------\n\t// reproject from previous frame and average\n    //------------------------------------------\n#ifdef USE_REPROJECTION\n    mat4 oldCam = mat4( textureLod(iChannel0,vec2(0.5,0.5)/iResolution.xy, 0.0),\n                        textureLod(iChannel0,vec2(1.5,0.5)/iResolution.xy, 0.0),\n                        textureLod(iChannel0,vec2(2.5,0.5)/iResolution.xy, 0.0),\n                        0.0, 0.0, 0.0, 1.0 );\n    \n    float asr = iResolution.y/iResolution.x;\n    vec4 wpos = vec4(ro + rd*t,1.0);        // world space\n    vec3 cpos = (wpos*oldCam).xyz;          // camera space (note inverse multiply)\n    vec2 npos = fl*cpos.xy/cpos.z;          // ndc space\n    vec2 spos = 0.5+0.5*npos*vec2(asr,1.0); // screen space\n    spos -= of/iResolution.xy;              // undo dither offset\n    vec2 rpos = spos*iResolution.xy;        // raster space\n    \n    if( rpos.y<1.0 && rpos.x<3.0 )\n    {\n    }\n\telse\n    {\n        vec3 ocol = textureLod( iChannel0, spos, 0.0 ).xyz;\n    \tif( iFrame==0 ) ocol = col;\n        col = mix( ocol, col, 0.25 );\n    }\n                           \n\tif( fragCoord.y<1.0 && fragCoord.x<3.0 )\n    {\n        if( abs(fragCoord.x-2.5)<0.5 ) fragColor = vec4( ca[2], -dot(ca[2],ro) );\n        if( abs(fragCoord.x-1.5)<0.5 ) fragColor = vec4( ca[1], -dot(ca[1],ro) );\n        if( abs(fragCoord.x-0.5)<0.5 ) fragColor = vec4( ca[0], -dot(ca[0],ro) );\n    }\n    else\n    {\n    \tcol *= smoothstep(0.0,1.0,fad);\n        fragColor = vec4( col, 1.0 );\n    }\n#else\n    col *= smoothstep(0.0,1.0,fad);\n    fragColor = vec4( col, 1.0 );\n#endif\n}",
            "name": "Buffer A",
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
          "id": "3dGSWR",
          "date": "1574034405",
          "viewed": 11699,
          "name": "Sphere FBM Terrain",
          "username": "iq",
          "description": "Creating a terrain using only sphere SDFs doesn't suffer from marching artifacts. Article about this technique: [url]https://iquilezles.org/articles/fbmsdf/fbmsdf.htm[/url]. Video render: [url]https://www.youtube.com/watch?v=mCdlfdpN-AM[/url]",
          "likes": 138,
          "published": 3,
          "flags": 32,
          "usePreview": 1,
          "tags": [
            "3d",
            "terrain",
            "sphere",
            "spherenoise"
          ],
          "hasliked": 0,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);