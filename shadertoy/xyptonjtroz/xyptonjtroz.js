var jsnShader = [
    {
        "ver": "0.1",
        "renderpass": [
          {
            "outputs": [],
            "inputs": [],
            "code": "// Xyptonjtroz by nimitz (twitter: @stormoid)\n// https://www.shadertoy.com/view/4ts3z2\n// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License\n// Contact the author for other licensing options\n\n//Audio by Dave_Hoskins\n\n#define ITR 100\n#define FAR 30.\n#define time iTime\n\n/*\n\tBelievable animated volumetric dust storm in 7 samples,\n\tblending each layer in based on geometry distance allows to\n\trender it without visible seams. 3d Triangle noise is \n\tused for the dust volume.\n\n\tAlso included is procedural bump mapping and glow based on\n\tcurvature*fresnel. (see: https://www.shadertoy.com/view/Xts3WM)\n\n\n\tFurther explanation of the dust generation (per Dave's request):\n\t\t\n\tThe basic idea is to have layers of gradient shaded volumetric\n\tanimated noise. The problem is when geometry is intersected\n\tbefore the ray reaches the far plane. A way to smoothly blend\n\tthe low sampled noise is needed.  So I am blending (smoothstep)\n\teach dust layer based on current ray distance and the solid \n\tinteresction distance. I am also scaling the noise taps\tas a \n\tfunction of the current distance so that the distant dust doesn't\n\tappear too noisy and as a function of current height to get some\n\t\"ground hugging\" effect.\n\t\n*/\n\nmat2 mm2(in float a){float c = cos(a), s = sin(a);return mat2(c,s,-s,c);}\n\nfloat height(in vec2 p)\n{\n    p *= 0.2;\n    return sin(p.y)*0.4 + sin(p.x)*0.4;\n}\n\n//smooth min (https://iquilezles.org/articles/smin)\nfloat smin( float a, float b)\n{\n\tfloat h = clamp(0.5 + 0.5*(b-a)/0.7, 0.0, 1.0);\n\treturn mix(b, a, h) - 0.7*h*(1.0-h);\n}\n\n\nvec2 nmzHash22(vec2 q)\n{\n    uvec2 p = uvec2(ivec2(q));\n    p = p*uvec2(3266489917U, 668265263U) + p.yx;\n    p = p*(p.yx^(p >> 15U));\n    return vec2(p^(p >> 16U))*(1.0/vec2(0xffffffffU));\n}\n\nfloat vine(vec3 p, in float c, in float h)\n{\n    p.y += sin(p.z*0.2625)*2.5;\n    p.x += cos(p.z*0.1575)*3.;\n    vec2 q = vec2(mod(p.x, c)-c/2., p.y);\n    return length(q) - h -sin(p.z*2.+sin(p.x*7.)*0.5+time*0.5)*0.13;\n}\n\nfloat map(vec3 p)\n{\n    p.y += height(p.zx);\n    \n    vec3 bp = p;\n    vec2 hs = nmzHash22(floor(p.zx/4.));\n    p.zx = mod(p.zx,4.)-2.;\n    \n    float d = p.y+0.5;\n    p.y -= hs.x*0.4-0.15;\n    p.zx += hs*1.3;\n    d = smin(d, length(p)-hs.x*0.4);\n    \n    d = smin(d, vine(bp+vec3(1.8,0.,0),15.,.8) );\n    d = smin(d, vine(bp.zyx+vec3(0.,0,17.),20.,0.75) );\n    \n    return d*1.1;\n}\n\nfloat march(in vec3 ro, in vec3 rd)\n{\n\tfloat precis = 0.002;\n    float h=precis*2.0;\n    float d = 0.;\n    for( int i=0; i<ITR; i++ )\n    {\n        if( abs(h)<precis || d>FAR ) break;\n        d += h;\n\t    float res = map(ro+rd*d);\n        h = res;\n    }\n\treturn d;\n}\n\nfloat tri(in float x){return abs(fract(x)-.5);}\nvec3 tri3(in vec3 p){return vec3( tri(p.z+tri(p.y*1.)), tri(p.z+tri(p.x*1.)), tri(p.y+tri(p.x*1.)));}\n                                 \nmat2 m2 = mat2(0.970,  0.242, -0.242,  0.970);\n\nfloat triNoise3d(in vec3 p, in float spd)\n{\n    float z=1.4;\n\tfloat rz = 0.;\n    vec3 bp = p;\n\tfor (float i=0.; i<=3.; i++ )\n\t{\n        vec3 dg = tri3(bp*2.);\n        p += (dg+time*spd);\n\n        bp *= 1.8;\n\t\tz *= 1.5;\n\t\tp *= 1.2;\n        //p.xz*= m2;\n        \n        rz+= (tri(p.z+tri(p.x+tri(p.y))))/z;\n        bp += 0.14;\n\t}\n\treturn rz;\n}\n\nfloat fogmap(in vec3 p, in float d)\n{\n    p.x += time*1.5;\n    p.z += sin(p.x*.5);\n    return triNoise3d(p*2.2/(d+20.),0.2)*(1.-smoothstep(0.,.7,p.y));\n}\n\nvec3 fog(in vec3 col, in vec3 ro, in vec3 rd, in float mt)\n{\n    float d = .5;\n    for(int i=0; i<7; i++)\n    {\n        vec3  pos = ro + rd*d;\n        float rz = fogmap(pos, d);\n\t\tfloat grd =  clamp((rz - fogmap(pos+.8-float(i)*0.1,d))*3., 0.1, 1. );\n        vec3 col2 = (vec3(.1,0.8,.5)*.5 + .5*vec3(.5, .8, 1.)*(1.7-grd))*0.55;\n        col = mix(col,col2,clamp(rz*smoothstep(d-0.4,d+2.+d*.75,mt),0.,1.) );\n        d *= 1.5+0.3;\n        if (d>mt)break;\n    }\n    return col;\n}\n\nvec3 normal(in vec3 p)\n{  \n    vec2 e = vec2(-1., 1.)*0.005;   \n\treturn normalize(e.yxx*map(p + e.yxx) + e.xxy*map(p + e.xxy) + \n\t\t\t\t\t e.xyx*map(p + e.xyx) + e.yyy*map(p + e.yyy) );   \n}\n\nfloat bnoise(in vec3 p)\n{\n    float n = sin(triNoise3d(p*.3,0.0)*11.)*0.6+0.4;\n    n += sin(triNoise3d(p*1.,0.05)*40.)*0.1+0.9;\n    return (n*n)*0.003;\n}\n\nvec3 bump(in vec3 p, in vec3 n, in float ds)\n{\n    vec2 e = vec2(.005,0);\n    float n0 = bnoise(p);\n    vec3 d = vec3(bnoise(p+e.xyy)-n0, bnoise(p+e.yxy)-n0, bnoise(p+e.yyx)-n0)/e.x;\n    n = normalize(n-d*2.5/sqrt(ds));\n    return n;\n}\n\nfloat shadow(in vec3 ro, in vec3 rd, in float mint, in float tmax)\n{\n\tfloat res = 1.0;\n    float t = mint;\n    for( int i=0; i<10; i++ )\n    {\n\t\tfloat h = map(ro + rd*t);\n        res = min( res, 4.*h/t );\n        t += clamp( h, 0.05, .5 );\n        if(h<0.001 || t>tmax) break;\n    }\n    return clamp( res, 0.0, 1.0 );\n\n}\n\nfloat curv(in vec3 p, in float w)\n{\n    vec2 e = vec2(-1., 1.)*w;   \n    \n    float t1 = map(p + e.yxx), t2 = map(p + e.xxy);\n    float t3 = map(p + e.xyx), t4 = map(p + e.yyy);\n    \n    return .125/(e.x*e.x) *(t1 + t2 + t3 + t4 - 4. * map(p));\n}\n\nvoid mainImage( out vec4 fragColor, in vec2 fragCoord )\n{\t\n\tvec2 p = fragCoord.xy/iResolution.xy-0.5;\n    vec2 q = fragCoord.xy/iResolution.xy;\n\tp.x*=iResolution.x/iResolution.y;\n    vec2 mo = iMouse.xy / iResolution.xy-.5;\n    mo = (mo==vec2(-.5))?mo=vec2(-0.1,0.07):mo;\n\tmo.x *= iResolution.x/iResolution.y;\n\t\n\tvec3 ro = vec3(smoothstep(0.,1.,tri(time*.45)*2.)*0.1, smoothstep(0.,1.,tri(time*0.9)*2.)*0.07, -time*0.6);\n    ro.y -= height(ro.zx)+0.05;\n    mo.x += smoothstep(0.6,1.,sin(time*.6)*0.5+0.5)-1.5;\n    vec3 eyedir = normalize(vec3(cos(mo.x),mo.y*2.-0.2+sin(time*0.45*1.57)*0.1,sin(mo.x)));\n    vec3 rightdir = normalize(vec3(cos(mo.x+1.5708),0.,sin(mo.x+1.5708)));\n    vec3 updir = normalize(cross(rightdir,eyedir));\n\tvec3 rd=normalize((p.x*rightdir+p.y*updir)*1.+eyedir);\n\t\n    vec3 ligt = normalize( vec3(.5, .05, -.2) );\n    vec3 ligt2 = normalize( vec3(.5, -.1, -.2) );\n    \n\tfloat rz = march(ro,rd);\n\t\n    vec3 fogb = mix(vec3(.7,.8,.8\t)*0.3, vec3(1.,1.,.77)*.95, pow(dot(rd,ligt2)+1.2, 2.5)*.25);\n    fogb *= clamp(rd.y*.5+.6, 0., 1.);\n    vec3 col = fogb;\n    \n    if ( rz < FAR )\n    {\n        vec3 pos = ro+rz*rd;\n        vec3 nor= normal( pos );\n        float d = distance(pos,ro);\n        nor = bump(pos,nor,d);\n        float crv = clamp(curv(pos, .4),.0,10.);\n        float shd = shadow(pos,ligt,0.1,3.);\n        float dif = clamp( dot( nor, ligt ), 0.0, 1.0 )*shd;\n        float spe = pow(clamp( dot( reflect(rd,nor), ligt ), 0.0, 1.0 ),50.)*shd;\n        float fre = pow( clamp(1.0+dot(nor,rd),0.0,1.0), 1.5 );\n        vec3 brdf = vec3(0.10,0.11,0.13);\n        brdf += 1.5*dif*vec3(1.00,0.90,0.7);\n        col = mix(vec3(0.1,0.2,1),vec3(.3,.5,1),pos.y*.5)*0.2+.1;\n        col *= (sin(bnoise(pos)*900.)*0.2+0.8);\n        col = col*brdf + col*spe*.5 + fre*vec3(.7,1.,0.2)*.3*crv;\n    }\n    \n    //ordinary distance fog first\n    col = mix(col, fogb, smoothstep(FAR-7.,FAR,rz));\n    \n    //then volumetric fog\n    col = fog(col, ro, rd, rz);\n    \n    //post\n    col = pow(col,vec3(0.8));\n    col *= 1.-smoothstep(0.1,2.,length(p));\n    \n\tfragColor = vec4( col, 1.0 );\n}\n",
            "name": "Image",
            "description": "",
            "type": "image"
          }
        ],
        "flags": {
          "mFlagVR": false,
          "mFlagWebcam": false,
          "mFlagSoundInput": false,
          "mFlagSoundOutput": true,
          "mFlagKeyboard": false,
          "mFlagMultipass": false,
          "mFlagMusicStream": false
        },
        "info": {
          "id": "4ts3z2",
          "date": "1423687697",
          "viewed": 27256,
          "name": "Xyptonjtroz",
          "username": "nimitz",
          "description": "Going out for a morning stroll on Xyptonjtroz.",
          "likes": 525,
          "published": 1,
          "flags": 8,
          "usePreview": 0,
          "tags": [
            "procedural",
            "3d",
            "raymarching",
            "noise",
            "volumetric",
            "bumpmapping",
            "storm",
            "dust"
          ],
          "hasliked": 1,
          "parentid": "",
          "parentname": ""
        }
      }
];

compileAndStart(jsnShader);