'use strict';

/* Shader #1 /////////////////////////////////////////////////////// */

const fragmentShader = `
#include <common>
 
uniform vec3 iResolution;
uniform float iTime;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
precision highp float;
 
// Main scene

// #define FREE_CAMERA

const float MATH_PI = float( 3.14159265359 );



float Square( float x )
{
    return x * x;
}

vec3 SRGB( vec3 x )
{
    return x * x;
}

float VisibilityTerm( float roughness, float ndotv, float ndotl )
{
	float m2	= roughness * roughness;
	float visV	= ndotl * sqrt( ndotv * ( ndotv - ndotv * m2 ) + m2 );
	float visL	= ndotv * sqrt( ndotl * ( ndotl - ndotl * m2 ) + m2 );
	return 0.5 / max( visV + visL, 0.00001 );
}

float DistributionTerm( float roughness, float ndoth )
{
	float m2	= roughness * roughness;
	float d		= ( ndoth * m2 - ndoth ) * ndoth + 1.0;
	return m2 / ( d * d * MATH_PI );
}

vec3 FresnelTerm( vec3 specularColor, float vdoth )
{
	vec3 fresnel = clamp( 50.0 * specularColor.y, 0.0, 1.0 ) * specularColor + ( 1.0 - specularColor ) * pow( ( 1.0 - vdoth ), 5.0 );
	return fresnel;
}

vec3 LightSpecular( vec3 normal, vec3 viewDir, vec3 lightDir, vec3 lightColor, float roughness, vec3 specularColor )
{
	vec3 halfVec = normalize( viewDir + lightDir );

	float vdoth = saturate( dot( viewDir,	halfVec	 ) );
	float ndoth	= saturate( dot( normal,	halfVec	 ) );
	float ndotv = saturate( dot( normal,	viewDir  ) );
	float ndotl = saturate( dot( normal,	lightDir ) );
    
   	vec3	f = FresnelTerm( specularColor, vdoth );
	float	d = DistributionTerm( roughness, ndoth );
	float	v = VisibilityTerm( roughness, ndotv, ndotl );
    
    vec3 specular;
	specular = lightColor * f * ( d * v * MATH_PI * ndotl );
	return specular;
}

float Sphere( vec3 p, float s )
{
    return length( p ) - s;
}

float RoundBox( vec3 p, vec3 b, float r )
{
 	vec3 d = abs( p ) - b;
	return min( max( d.x, max( d.y, d.z ) ), 0.0 ) + length( max( d, 0.0 ) ) - r;
}

float Intersect( float a, float b )
{
    return max( a, b );
}

float Substract( float a, float b )
{
    return max( a, -b );
}

float SubstractRound( float a, float b, float r ) 
{
    vec2 u = max( vec2( r + a, r - b ), vec2( 0.0, 0.0 ) );
    return min( -r, max( a, -b ) ) + length( u );
}

float Union( float a, float b )
{
    return min( a, b );
}

float UnionRound( float a, float b, float r ) 
{
    vec2 u = max( vec2( r - a, r - b ), vec2( 0.0, 0.0 ) );
    return max( r, min( a, b ) ) - length( u );
}

void Rotate( inout vec2 p, float a ) 
{
    p = cos( a ) * p + sin( a ) * vec2( p.y, -p.x );
}

float Rand( vec2 co )
{
    return fract( sin( dot( co.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 );
}

float Terrain( vec2 p )
{	
	float ret = 0.0;
    
    p.x += cos( p.y * 0.1 ) * 10.0;
    
    ret = sin( p.x * 0.07 ) * 4.0 + cos( p.y * 0.08 + p.x * 0.03 ) * 2.0 + sin( p.y * 0.01 - 0.5 * MATH_PI ) * 20.0 + 15.0;
	ret += textureLod( iChannel0, p / 32.0, 1.0 ).x * 0.5 + textureLod( iChannel0, p / 64.0, 1.0 ).x * 1.0;
    return ret;
}

float Scene( vec3 p )
{
    float ret = p.y - Terrain( p.xz );

    vec3 t = p;
    t.x = mod( t.x, 200.0 ) - 0.5 * 200.0;
    t.z = mod( t.z, 200.0 ) - 0.5 * 200.0;
    Rotate( t.yz, 0.1 * MATH_PI );      
    ret = UnionRound( ret, RoundBox( t, vec3( 10.0, 100.0, 10.0 ), 2.0 ), 30.0 );
    
    t = p;
    t.x = mod( t.x, 150.0 ) - 0.5 * 150.0;
    t.z = mod( t.z, 150.0 ) - 0.5 * 150.0;
    Rotate( t.yz, -0.2 * MATH_PI );      
    ret = UnionRound( ret, RoundBox( t, vec3( 4.0, 30.0, 4.0 ), 1.0 ), 6.0 );    
    
    t = p;
    t.x = mod( t.x, 30.0 ) - 0.5 * 30.0;
    t.z = mod( t.z, 30.0 ) - 0.5 * 30.0;
    Rotate( t.yz, 0.2 * MATH_PI );
    t.y += 4.0;
    float box2 = RoundBox( t, vec3( 2.0, 10.0, 2.0 ), 0.25 );
    
    t = p;
    t.x = mod( t.x, 70.0 ) - 0.5 * 70.0;
    t.z = abs( t.z ) - 30.0;
	Rotate( t.xz, 0.2 * MATH_PI ); 
    t.y += 4.0;
    box2 = Union( box2, RoundBox( t, vec3( 4.0, 8.0, 10.0 ), 1.0 ) );

    ret = UnionRound( ret, box2, 3.0 );
    
    t = p;
    t.x -= 150.0;
    t.x = mod( t.x, 200.0 ) - 0.5 * 200.0;
    t.y += 2.0;
    t.z = abs( t.z ) - 7.0;
    Rotate( t.yz, -0.1 * MATH_PI );
    float tunnel = RoundBox( t, vec3( 2.0, 13.0, 2.0 ), 0.25 );
    tunnel = Union( tunnel, RoundBox( t + vec3( 8.0, 0.0, 0.0 ), vec3( 2.0, 7.0, 2.0 ), 0.25 ) );
    tunnel = Union( tunnel, RoundBox( t + vec3( 16.0, 0.0, 0.0 ), vec3( 2.0, 9.0, 2.0 ), 0.25 ) );
	tunnel = Union( tunnel, RoundBox( t + vec3( 32.0, 0.0, 0.0 ), vec3( 2.0, 12.0, 2.0 ), 0.25 ) );
	tunnel = Union( tunnel, RoundBox( t + vec3( 40.0, 0.0, 0.0 ), vec3( 2.0, 7.0, 2.0 ), 0.25 ) );
    ret = UnionRound( ret, tunnel, 3.0 );
                   
    return ret;
}

float CastRay( in vec3 ro, in vec3 rd )
{
    const float maxd = 500.0;
    
    float h = 1.0;
    float t = 0.0;
   
    for ( int i = 0; i < 128; ++i )
    {
        if ( h < 0.01 || t > maxd ) 
        {
            break;
        }
        
        h = Scene( ro + rd * t );
        t += h;
    }

    if ( t > maxd )
    {
        t = -1.0;
    }

    return t;
}

vec3 SceneNormal( in vec3 pos )
{
    vec3 eps = vec3( 0.01, 0.0, 0.0 );
    vec3 nor = vec3(
        Scene( pos + eps.xyy ) - Scene( pos - eps.xyy ),
        Scene( pos + eps.yxy ) - Scene( pos - eps.yxy ),
        Scene( pos + eps.yyx ) - Scene( pos - eps.yyx ) );
    return normalize( -nor );
}

vec3 NormalMapTex( vec2 uv )
{
	float eps = -1.0 / 256.0;        
    float a = texture( iChannel2, uv + vec2( 0.0, 0.0 ) ).x;
	float b = texture( iChannel2, uv + vec2( eps, 0.0 ) ).x;
    float c = texture( iChannel2, uv + vec2( 0.0, eps ) ).x;
	return -normalize( vec3( b - a, 0.25, c - a ) );
}

vec3 NormalMap( vec3 normal, vec3 pos, vec3 triPlanarWeights )
{
    return normalize( normal + NormalMapTex( pos.yz ) * triPlanarWeights.x + NormalMapTex( pos.xz ) * triPlanarWeights.y + NormalMapTex( pos.xy ) * triPlanarWeights.z );
}

float SmoothNoise( vec3 v )
{
	vec3 i = floor( v );
	vec3 f = fract( v );

	f = f * f * ( -2.0 * f + 3.0 );

	vec2 uv		= ( i.xy + vec2( 7.0, 17.0 ) * i.z ) + f.xy;
	float lowz	= textureLod( iChannel1, ( uv.xy + 0.5 ) / 64.0, 0.0 ).x;

	uv			= ( i.xy + vec2( 7.0, 17.0 ) * ( i.z + 1.0 ) ) + f.xy;
	float highz = textureLod( iChannel1, ( uv.xy + 0.5 ) / 64.0, 0.0 ).x;
	float r		= mix( lowz, highz, f.z );

	return 2.0 * r - 1.0;
}

float DensityNoise( vec3 pos, vec3 noisePosScale, vec3 noisePosScaleBias, float noiseScale, float noiseBias )
{
	pos = pos * noisePosScale + noisePosScaleBias;

	float noise = SmoothNoise( pos ) + 0.5 * SmoothNoise( pos * 3.07 );
	noise = saturate( noise * noiseScale + noiseBias );

	return noise;
}

void VolumetricFog( inout vec3 color, vec3 rayOrigin, vec3 rayDir, float sceneT, vec2 fragCoord )
{
    sceneT = sceneT <= 0.0 ? 500.0 : sceneT;
    
    float fogHeightFalloff = 0.1;
    float fogDensity = 0.10;
    
    vec3 seed = vec3( 0.06711056, 0.00583715, 52.9829189 );
    float dither = fract( seed.z * fract( dot( fragCoord.xy, seed.xy ) ) );
    
    float fogAlpha = 0.0;
    for ( int i = 0; i < 64; ++i )
    {
        float stepSize = 1.0;        
        float t = ( float( i ) + 0.5 + dither ) * stepSize;
        if ( t <= sceneT )
        {
        	vec3 p = rayOrigin + t * rayDir;
        	float s = DensityNoise( p + vec3( iTime * 1.0, 0.0, iTime * 3.0 ), vec3( 0.3 ), vec3( 0.0, 0.0, 0.0 ), 1.0, 0.0 ) * exp( -( p.y + 10.0 ) * fogHeightFalloff );
            fogAlpha += s * fogDensity * stepSize * ( 1.0 - exp( -fogDensity * t ) );
        }
    } 
    
    fogAlpha = saturate( fogAlpha );
    
    vec3 lightDir 		= normalize( vec3( -0.8, -1.0, -0.8 ) );
    float k				= 0.8;
	float cosPhi		= dot( lightDir, rayDir );
	float shlickPhase	= ( 1.0 - k * k ) / ( 4.0 * MATH_PI * Square( 1.0 + k * cosPhi ) );
    vec3 fogColor 		= vec3( 0.6, 0.5, 0.4 ) * 1.0 + vec3( 1.0, 1.0, 0.5 ) * shlickPhase;
    
    color = color * ( 1.0 - fogAlpha ) + fogColor * fogAlpha;
}

float RaySphere( vec3 rayOrigin, vec3 rayDir, vec3 spherePos, float sphereRadius )
{
	vec3 oc = rayOrigin - spherePos;
	
	float b = dot( oc, rayDir );
	float c = dot( oc, oc ) - sphereRadius * sphereRadius;
	float h = b * b - c;
	
	float t;
	if ( h < 0.0 )
    {
		t = -1.0;
    }
	else
    {
		t = ( -b - sqrt( h ) );
    }
	return t;
}

vec3 Sky( vec3 rayDir )
{
    // sky and sun
    vec3 skyPos     = rayDir;
    vec2 skyAngle   = vec2( atan( skyPos.z, skyPos.x ), acos( skyPos.y ) );

    // sky
    vec3 color = mix( vec3( 0.17, 0.16, 0.09 ), vec3( 0.34, 0.09, 0.07 ), saturate( 0.6 - skyPos.y ) );    
    color += vec3( texture( iChannel3, skyAngle ) ) * 0.05;
    
    // sun
    float sun = exp( -5.0 * length( skyAngle - vec2( 0.8, 1.0 ) ) );
    color += vec3( 1.0, 1.0, 0.5 ) * sun;
    
    sun = RaySphere( vec3( 0.0 ), rayDir, vec3( 1.0, 1.0, 1.0 ), 0.05 );
    if ( sun >= 0.0 )
    	color = vec3( 1.0, 1.0, 0.9 );    


    vec3 planetPos0 = vec3( 1.5, 0.5, -0.8 );
    vec3 planetPos1 = vec3( 0.0, 4.0, 8.0 );
    float planet0 = RaySphere( vec3( 0.0 ), rayDir, planetPos0, 0.6 );
    float planet1 = RaySphere( vec3( 0.0 ), rayDir, planetPos1, 2.0 );
    
    float planet = max( planet0, planet1 );
    vec3 planetPos = planet1 >= 0.0 ? planetPos1 : planetPos0;

    if ( planet >= 0.0 )
    {
    	vec3 planetNormal = normalize( planetPos - planet * rayDir );
    	vec3 lightDir = normalize( planetPos - vec3( 15.0, 15.0, 15.0 ) );
    	color = color * 0.8 + vec3( 1.0, 1.0, 0.5 ) * saturate( dot( planetNormal, lightDir ) );
    }  
    
    // stars
    vec2 starTile   = floor( skyAngle.xy * 20.0 );
    vec2 starPos    = fract( skyAngle.xy * 20.0 ) * 2.0 - 1.0;
    float starRand  = Rand( starTile + vec2( 0.1, 0.3 ) );
    starRand = starRand > 0.9 ? starRand : 0.0;
    starRand = planet >= 0.0 ? 0.0 : starRand;
    color += 0.2 * vec3( 1.2, 2.0, 1.2 ) * starRand * exp( -20.0 * length( starPos ) );    
    
    // meteors
    vec2 meteorAngle = vec2( skyAngle.x + skyAngle.y, skyAngle.x - skyAngle.y );
    vec2 meteorPos0 = ( meteorAngle.xy + vec2( 0.0, iTime * 0.5 ) );
    vec2 meteorPos1 = ( meteorAngle.xy + vec2( 0.0, iTime * 0.5 + 0.75 ) );
    meteorPos0.x = fract( meteorPos0.x + floor( meteorPos0.y ) * 0.13171243 );
    meteorPos1.x = fract( meteorPos1.x + floor( meteorPos1.y ) * 0.34234243 + 0.5 );
    meteorPos0.y = fract( meteorPos0.y * 0.5 ) * 2.0;
    meteorPos1.y = fract( meteorPos1.y * 0.5 ) * 2.0;
    meteorPos0 = meteorPos0 * 2.0 - 1.0;
    meteorPos1 = meteorPos1 * 2.0 - 1.0;
	meteorPos0.y *= 0.05;
    meteorPos1.y *= 0.05;
    color += 0.1 * vec3( 1.2, 2.0, 1.2 ) * exp( -150.0 * min( length( meteorPos0 ), length( meteorPos1 ) ) );
    
    return color;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 screenUV = fragCoord.xy / iResolution.xy;
    vec2 p = -1.0 + 2.0 * screenUV;
    p.x *= iResolution.x / iResolution.y;
    p.x = 1.0 - p.x;

    vec2 mo = iMouse.xy / iResolution.xy;
    
    float cameraOffset	= iTime * 5.0;
    float yaw           = 0.35 * MATH_PI;    
    float pitch         = -0.3;
    
    float camTime = mod( iTime, 40.0 );
    
    float w = smoothstep( 0.0, 1.0, saturate( camTime * 0.25 ) );
    yaw 	= mix( yaw, 	1.3, w );
    pitch 	= mix( pitch, 	0.3, w );    

    w = smoothstep( 0.0, 1.0, saturate( ( camTime - 4.0 ) * 0.1 ) );
    yaw 	= mix( yaw, 	0.1 * MATH_PI, w );
    pitch 	= mix( pitch, 	-0.2 * MATH_PI, w );
    
    w = smoothstep( 0.0, 1.0, saturate( ( camTime - 15.0 ) * 0.07 ) );
    yaw 	= mix( yaw, 	0.8 * MATH_PI, w );
    pitch 	= mix( pitch, 	0.0, w );
    
    w = smoothstep( 0.0, 1.0, saturate( ( camTime - 25.0 ) * 0.1 ) );
    yaw 	= mix( yaw, 	0.35 * MATH_PI, w );
    pitch 	= mix( pitch, 	-0.3, w );
    
#ifdef FREE_CAMERA
    yaw		= -6.0 * mo.x - 0.5 * MATH_PI;    
    pitch	= -6.0 * mo.y + 0.5 * MATH_PI;
#endif
    
    vec3 rayOrigin;    
    rayOrigin.x = iTime * 5.0;
    rayOrigin.y = Terrain( vec2( rayOrigin.x, 0.0 ) ) + 3.0;
    rayOrigin.z = 0.0;
    
    mat3 rotY = mat3(
        vec3( cos( yaw ), 0.0, -sin( yaw ) ),
		vec3( 0.0, 1.0, 0.0 ),        
        vec3( sin( yaw ), 0.0, cos( yaw ) )
        );          
    
    mat3 rotZ = mat3(
        vec3( 1.0, 0.0, 0.0 ),
        vec3( 0.0, cos( pitch ), sin( pitch ) ),
        vec3( 0.0, -sin( pitch ), cos( pitch ) )
        );    
    
    // ray direction
    vec3 rayDir = rotY * rotZ * normalize( vec3( p.xy, 2.5 ) );  
    vec3 color = vec3( 0.0 );
    
    float t = CastRay( rayOrigin, rayDir );
    if ( t > 0.0 )
    {
        vec3 pos = rayOrigin + t * rayDir;
        vec3 normal = SceneNormal( pos );
        
        // texture scale
        float uvScale 			= 0.25; 
        float normalMapScale 	= 0.5;
        if ( abs( pos.z ) > 50.0 )
        {
            uvScale 		= 0.05;
            normalMapScale 	= 0.25;
        }
        
		vec3 triPlanarWeights = abs( normal );
        triPlanarWeights = normalize( max( triPlanarWeights, 0.0001 ) );
		triPlanarWeights /= triPlanarWeights.x + triPlanarWeights.y + triPlanarWeights.z;

        vec3 diffuseColor	= vec3( 1.0 );
        vec3 specularColor 	= vec3( 0.04 );
        vec3 emissive 		= vec3( 0.0 );
        float roughness 	= 1.0;
                
        float snowLayer = texture( iChannel0, pos.xz * 0.005 ).x
        	+ 0.5 * texture( iChannel3, pos.xz * 0.01 ).x
            + 0.25 * texture( iChannel2, pos.xz * 0.05 ).x;
        float snow = saturate( ( snowLayer - 0.5 ) * 4.0 ) * saturate( -normal.y );
        
        // ice
		diffuseColor 	= vec3( 0.0 );
		specularColor 	= vec3( 0.04 );
		roughness		= 0.1;
        normal			= NormalMap( normal, pos * uvScale, triPlanarWeights * normalMapScale );

       	// snow
       	diffuseColor 	= mix( diffuseColor, vec3( 0.7 ), snow );
       	specularColor 	= vec3( 0.04 );
       	roughness		= mix( roughness, 1.0, snow );

        vec3 lightColor = vec3( 1.0, 1.0, 0.8 ) * 2.0;
        vec3 lightDir 	= normalize( vec3( -0.8, -1.0, -0.8 ) );

        float wrap = 0.5;
        vec3 diffuse = lightColor * saturate( ( dot( normal, lightDir ) + wrap ) / ( ( 1.0 + wrap ) * ( 1.0 + wrap ) ) );
        color = diffuseColor * diffuse;
        color += LightSpecular( normal, rayDir, lightDir, lightColor, roughness, specularColor );
                
        // ambient
        float ndotv = saturate( dot( normal, rayDir ) );
        vec3 envSpecular = FresnelTerm( specularColor, ndotv );        
        vec3 refl = reflect( rayDir, normal );
        color += diffuseColor * 0.2;
        color += envSpecular * Sky( refl );
        
        // refraction        
        float depth0 = abs( pos.z ) > 50.0 ? 10.0 : 1.0;
        float depth1 = depth0 * 5.0;
        vec3 refrRayDir = refract( rayDir, -normal, 1.03 );
        refrRayDir = normalize( mix( rayDir, refrRayDir, smoothstep( 0.0, 1.0, saturate( length( refrRayDir ) ) ) ) );
        vec2 layer0UVX = ( rayOrigin + ( t + depth0 ) * refrRayDir ).yz * uvScale;
        vec2 layer1UVX = ( rayOrigin + ( t + depth1 ) * refrRayDir ).yz * uvScale * 0.5 + 0.5;
        vec2 layer0UVY = ( rayOrigin + ( t + depth0 ) * refrRayDir ).xz * uvScale;
        vec2 layer1UVY = ( rayOrigin + ( t + depth1 ) * refrRayDir ).xz * uvScale * 0.5 + 0.5;
        vec2 layer0UVZ = ( rayOrigin + ( t + depth0 ) * refrRayDir ).xy * uvScale;
        vec2 layer1UVZ = ( rayOrigin + ( t + depth1 ) * refrRayDir ).xy * uvScale * 0.5 + 0.5;
        
        float refrLayer0X = texture( iChannel0, layer0UVX ).xyz.x;
        float refrLayer1X = texture( iChannel0, layer1UVX ).xyz.x;
        float refrLayer0Y = texture( iChannel0, layer0UVY ).xyz.x;
        float refrLayer1Y = texture( iChannel0, layer1UVY ).xyz.x;
        float refrLayer0Z = texture( iChannel0, layer0UVZ ).xyz.x;
        float refrLayer1Z = texture( iChannel0, layer1UVZ ).xyz.x;

        vec3 iceFogColor = vec3( 0.3, 0.6, 0.7 ); 
        vec3 refrColorX = vec3( refrLayer0X + ( 1.0 - refrLayer0X ) * refrLayer1X + 0.1 ) * iceFogColor;
        vec3 refrColorY = vec3( refrLayer0Y + ( 1.0 - refrLayer0Y ) * refrLayer1Y + 0.1 ) * iceFogColor;
        vec3 refrColorZ = vec3( refrLayer0Z + ( 1.0 - refrLayer0Z ) * refrLayer1Z + 0.1 ) * iceFogColor;

        vec3 refrColor = refrColorX * triPlanarWeights.x + refrColorY * triPlanarWeights.y + refrColorZ * triPlanarWeights.z;
        refrColor = refrColor * refrColor;
        color += ( 1.0 - envSpecular ) * refrColor * ( 1.0 - snow );
        
		// fog
        color = mix( vec3( 0.17, 0.16, 0.09 ), color, saturate( exp( -0.005 * t ) ) );
    }
    else
    {
        color = Sky( rayDir );
    }
    
	VolumetricFog( color, rayOrigin, rayDir, t, fragCoord );
    
    fragColor = vec4( color, 1.0 );
}
 
void main() {
  mainImage(gl_FragColor, gl_FragCoord.xy);
}
`;


/* global THREE //////////////////////////////////////////////////// */



function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({canvas});
    renderer.autoClearColor = false;

    //load textures
    const loader = new THREE.TextureLoader();
    const texture0 = loader.load('frozen-barrens/iChannel0.png');
    texture0.minFilter = THREE.NearestFilter;
    texture0.magFilter = THREE.NearestFilter;
    texture0.wrapS = THREE.RepeatWrapping;
    texture0.wrapT = THREE.RepeatWrapping;
    const texture1 = loader.load('frozen-barrens/iChannel1.png');
    texture1.minFilter = THREE.NearestFilter;
    texture1.magFilter = THREE.NearestFilter;
    texture1.wrapS = THREE.RepeatWrapping;
    texture1.wrapT = THREE.RepeatWrapping;
    const texture2 = loader.load('frozen-barrens/iChannel2.jpg');
    texture2.minFilter = THREE.NearestFilter;
    texture2.magFilter = THREE.NearestFilter;
    texture2.wrapS = THREE.RepeatWrapping;
    texture2.wrapT = THREE.RepeatWrapping;
    const texture3 = loader.load('frozen-barrens/iChannel3.jpg');
    texture3.minFilter = THREE.NearestFilter;
    texture3.magFilter = THREE.NearestFilter;
    texture3.wrapS = THREE.RepeatWrapping;
    texture3.wrapT = THREE.RepeatWrapping;
    const uniforms = {
        iTime: { value: 0 },
        iResolution:  { value: new THREE.Vector3() },
        iChannel0: { value: texture0 },
        iChannel1: { value: texture1 },
        iChannel2: { value: texture2 },
        iChannel3: { value: texture3 },
    };

    const camera = new THREE.OrthographicCamera(
    -1, // left
        1, // right
        1, // top
    -1, // bottom
    -1, // near,
        1, // far
    );
    const scene = new THREE.Scene();
    const plane = new THREE.PlaneBufferGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
    fragmentShader,
    uniforms,
    });
    scene.add(new THREE.Mesh(plane, material));

    function resizeRendererToDisplaySize(renderer) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
        return needResize;
    }

    resizeRendererToDisplaySize(renderer);
    uniforms.iResolution.value.set(canvas.width, canvas.height, 1);

    function render(time) {
    time *= 0.001;  // convert to seconds
    uniforms.iTime.value = time;

    renderer.render(scene, camera);
    requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
