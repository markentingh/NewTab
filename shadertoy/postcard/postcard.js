var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [
              {
                "channel": 0,
                "type": "texture",
                "id": "4dXGzn",
                "filepath": "/media/a/0c7bf5fe9462d5bffbd11126e82908e39be3ce56220d900f633d58fb432e56f5.png",
                "sampler": {
                  "filter": "mipmap",
                  "wrap": "repeat",
                  "vflip": "false",
                  "srgb": "false",
                  "internal": "byte"
                }
              }
            ],
            "code": "// Postcard by nimitz (twitter: @stormoid)\n// https://www.shadertoy.com/view/XdBSWd\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n/*\n\tImplementation of: https://iquilezles.org/articles/dynclouds\n\t\n\tAdded some raymarched mountains and normal mapped water to complete the scene.\n\n\tOne thing I did differently is modyfying the scale of the fbm based on the distance\n\tfrom the shaded clouds allowing for a much less \"planar\" look to the cloud layer.  \n*/\n\n//Compare with simple clouds\n//#define BASIC_CLOUDS\n\n#define time iTime*2.\n#define FAR 420.\n\n//------------------------------------------------------------------\n//----------------------Utility functions---------------------------\n//------------------------------------------------------------------\nvec3 rotx(vec3 p, float a){\n    float s = sin(a), c = cos(a);\n    return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);\n}\nvec3 roty(vec3 p, float a){\n    float s = sin(a), c = cos(a);\n    return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);\n}\nfloat nmzHash(vec2 q)\n{\n    uvec2 p = uvec2(ivec2(q));\n    p = p*uvec2(374761393U,22695477U) + p.yx;\n    p.x = p.x*(p.y^(p.x>>15U));\n    return float(p.x^(p.x >> 16U))*(1.0/float(0xffffffffU));\n}\nfloat noise(in vec2 p) {\n    vec2 ip = floor(p);\n    vec2 fp = fract(p);\n\tvec2 u = fp*fp*(3.0-2.0*fp);\n    return -1.0+2.0*mix( mix( nmzHash( ip + vec2(0.0,0.0) ), nmzHash( ip + vec2(1.0,0.0) ), u.x),\n                mix(nmzHash( ip + vec2(0.0,1.0) ), nmzHash( ip + vec2(1.0,1.0)), u.x), u.y);\n}\n//------------------------------------------------------------------\n//---------------------------Terrain--------------------------------\n//------------------------------------------------------------------\nfloat terrain(in vec2 p)\n{\n    p*= 0.035;\n    float rz = 0.;\n    float m = 1.;\n    float z = 1.;\n    for(int i=0; i<=2; i++) \n    {\n        rz += (sin(noise(p/m)*1.7)*0.5+0.5)*z;\n        m *= -0.25;\n        z *= .2;\n    }\n    rz=exp2(rz-1.5);\n    rz -= sin(p.y*.2+sin(p.x*.45));\n    return rz*20.-14.;\n}\n\nfloat tmap(in vec3 p){ return p.y-terrain(p.zx);}\n//Using \"cheap AA\" from eiffie (https://www.shadertoy.com/view/XsSXDt)\nvec3 tmarch(in vec3 ro, in vec3 rd, in float d)\n{\n\tfloat precis = 0.01;\n    float h=precis*2.0;\n    float hm = 100., dhm = 0.;\n    for( int i=0; i<15; i++ )\n    {   \n        d += h = tmap(ro+rd*d)*1.5;\n        if (h < hm)\n        {\n            hm = h;\n            dhm = d;\n        }\n        if( abs(h)<precis||d>FAR ) break;\n    }\n\treturn vec3(d, hm, dhm);\n}\n\n\nvec3 normal( in vec3 pos, float t )\n{\n\tfloat e = 0.001*t;\n    vec2  eps = vec2(e,0.0);\n    float h = terrain(pos.xz);\n    return normalize(vec3( terrain(pos.xz-eps.xy)-h, e, terrain(pos.xz-eps.yx)-h ));\n}\n\nfloat plane( in vec3 ro, in vec3 rd, vec3 c, vec3 u, vec3 v )\n{\n\tvec3 q = ro - c;\n\tvec3 n = cross(u,v);\n    return -dot(n,q)/dot(rd,n);\n}\n//------------------------------------------------------------------\n//-------------------------2d Clouds--------------------------------\n//------------------------------------------------------------------\nvec3 lgt = normalize(vec3(-1.0,0.1,.0));\nvec3 hor = vec3(0);\n\nfloat nz(in vec2 p){return texture(iChannel0, p*.01).x;}\nmat2 m2 = mat2( 0.80,  0.60, -0.60,  0.80 );\nfloat fbm(in vec2 p, in float d)\n{\t\n\td = smoothstep(0.,100.,d);\n    p *= .3/(d+0.2);\n    float z=2.;\n\tfloat rz = 0.;\n    p  -= time*0.02;\n\tfor (float i= 1.;i <=5.;i++ )\n\t{\n\t\trz+= (sin(nz(p)*6.5)*0.5+0.5)*1.25/z;\n\t\tz *= 2.1;\n\t\tp *= 2.15;\n        p += time*0.027;\n        p *= m2;\n\t}\n    return pow(abs(rz),2.-d);\n}\n\nvec4 clouds(in vec3 ro, in vec3 rd, in bool wtr)\n{   \n\t\n    //Base sky coloring is from iq's \"Canyon\" (https://www.shadertoy.com/view/MdBGzG)\n    float sun = clamp(dot(lgt,rd),0.0,1.0 );\n    hor = mix( 1.*vec3(0.70,1.0,1.0), vec3(1.3,0.55,0.15), 0.25+0.75*sun );\n    vec3 col = mix( vec3(0.5,0.75,1.), hor, exp(-(4.+ 2.*(1.-sun))*max(0.0,rd.y-0.05)) );\n    col *= 0.4;\n\t\n    if (!wtr)\n    {\n        col += 0.8*vec3(1.0,0.8,0.7)*pow(sun,512.0);\n        col += 0.2*vec3(1.0,0.4,0.2)*pow(sun,32.0);\n    }\n    else \n    {\n        col += 1.5*vec3(1.0,0.8,0.7)*pow(sun,512.0);\n        col += 0.3*vec3(1.0,0.4,0.2)*pow(sun,32.0);\n    }\n    col += 0.1*vec3(1.0,0.4,0.2)*pow(sun,4.0);\n    \n\tfloat pt = (90.0-ro.y)/rd.y; \n    vec3 bpos = ro + pt*rd;\n    float dist = sqrt(distance(ro,bpos));\n    float s2p = distance(bpos,lgt*100.);\n    \n    const float cls = 0.002;\n    float bz = fbm(bpos.xz*cls,dist);\n    float tot = bz;\n    const float stm = .0;\n    const float stx = 1.15;\n    tot = smoothstep(stm,stx,tot);\n    float ds = 2.;\n    for (float i=0.;i<=3.;i++)\n    {\n\n        vec3 pp = bpos + ds*lgt;\n        float v = fbm(pp.xz*cls,dist);\n        v = smoothstep(stm,stx,v);\n        tot += v;\n        #ifndef BASIC_CLOUDS\n        ds *= .14*dist;\n        #endif\n    }\n\n    col = mix(col,vec3(.5,0.5,0.55)*0.2,pow(bz,1.5));\n    tot = smoothstep(-7.5,-0.,1.-tot);\n    vec3 sccol = mix(vec3(0.11,0.1,0.2),vec3(.2,0.,0.1),smoothstep(0.,900.,s2p));\n    col = mix(col,sccol,1.-tot)*1.6;\n    vec3 sncol = mix(vec3(1.4,0.3,0.),vec3(1.5,.65,0.),smoothstep(0.,1200.,s2p));\n    float sd = pow(sun,10.)+.7;\n    col += sncol*bz*bz*bz*tot*tot*tot*sd;\n    \n    if (wtr) col = mix(col,vec3(0.5,0.7,1.)*0.3,0.4); //make the water blue-er\n    return vec4(col,tot);\n}\n//------------------------------------------------------------------\n//-------------------------------Extras-----------------------------\n//------------------------------------------------------------------\nfloat bnoise(in vec2 p)\n{\n    float d = sin(p.x*1.5+sin(p.y*.2))*0.1;\n    return d += texture(iChannel0,p.xy*0.01+time*0.001).x*0.04;\n}\n\nvec3 bump(in vec2 p, in vec3 n, in float t)\n{\n    vec2 e = vec2(40.,0)/(t*t);\n    float n0 = bnoise(p);\n    vec3 d = vec3(bnoise(p+e.xy)-n0,2., bnoise(p+e.yx)-n0)/e.x;\n    n = normalize(n-d);\n    return n;\n}\n//------------------------------------------------------------------\n//------------------------------------------------------------------\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\t\n    vec2 bp = fragCoord.xy/iResolution.xy*2.-1.;\n    vec2 p  = bp;\n\tp.x*=iResolution.x/iResolution.y;\n\tvec2 mo = iMouse.xy / iResolution.xy-.5;\n    mo = (mo==vec2(-.5))?mo=vec2(-0.4,-0.15):mo;\n\tmo.x *= iResolution.x/iResolution.y;\n\tvec3 ro = vec3(140.,0.,100.);\n    vec3 rd = normalize(vec3(p,-2.7));\n    rd = rotx(rd,0.15+mo.y*0.4);rd = roty(rd,1.5+mo.x*0.5);\n    vec3 brd = rd;\n    vec3 col = vec3(0);\n\t\t\n\tfloat pln = plane(ro, rd, vec3(0.,-4.,0), vec3(1.,0.,0.), vec3(0.0,.0,1.0));\n    vec3 ppos = ro + rd*pln;\n    bool wtr = false;\n    vec3 bm = vec3(0);\n    if (pln < 500. && pln > 0.)\n    {\n        vec3 n = vec3(0,1,0);\n        float d= distance(ro,ppos);\n        n = bump(ppos.xz,n,d);\n        bm = n;\n        rd = reflect(rd,n);\n        wtr = true;\n    }\n    vec4 clo = clouds(ro, rd, wtr);\n    col = clo.rgb;\n    \n    vec3 rz = tmarch(ro,brd,350.);\n    float px = 3.5/iResolution.y;\n    if (rz.x < FAR && (rz.x < pln || pln < 0.))\n    {\n        vec3 pos = ro + brd*rz.x;\n        float dst = distance(pos, ro);\n        vec3 nor = normal(pos,dst);\n        float nl = clamp(dot(nor,lgt),0.,1.);\n        vec3 mcol = vec3(0.04)+vec3(nl)*0.4*vec3(.5,0.35,0.1);\n        mcol = mix(mcol,hor,smoothstep(210.,400.,rz.x-(pos.y+18.)*5.));//fogtains\n        col = mix(mcol,col,clamp(rz.y/(px*rz.z),0.,1.));\n    }\n    \n    //smooth water edge\n    if (wtr && rz.x > pln)col = mix(col,hor*vec3(0.3,0.4,.6)*0.4,smoothstep(10.,200.,pln));\n    \n    //post\n    col = pow(clamp(col,0.0,1.0), vec3(.9));\n    col.g *= 0.93;\n    //fancy vignetting\n    float vgn1 = pow(smoothstep(0.0,.3,(bp.x + 1.)*(bp.y + 1.)*(bp.x - 1.)*(bp.y - 1.)),.5);\n    float vgn2 = 1.-pow(dot(vec2(bp.x*.3, bp.y),bp),3.);\n    col *= mix(vgn1,vgn2,.4)*.5+0.5;\n\tfragColor = vec4( col, 1.0 );\n}",
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
          "id": "XdBSWd",
          "date": "1416961271",
          "viewed": 6575,
          "name": "Postcard",
          "username": "nimitz",
          "description": "Time is sped up to allow the dynamic nature of the clouds to be seen.  Mouse enabled.",
          "likes": 146,
          "published": 1,
          "flags": 0,
          "usePreview": 0,
          "tags": [
            "2d",
            "clouds",
            "aa",
            "technique"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);