<?php
/**
 * Casa Norte theme setup.
 *
 * @package casanorte
 */

defined( 'ABSPATH' ) || exit;

define( 'CN_VERSION', '1.0.0' );

require get_template_directory() . '/inc/post-types.php';
require get_template_directory() . '/inc/leads.php';

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/main.css' );
	register_nav_menus( array(
		'primary' => __( 'Primary menu', 'casanorte' ),
		'footer'  => __( 'Footer menu', 'casanorte' ),
	) );
} );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'cn-main', get_template_directory_uri() . '/assets/css/main.css', array(), CN_VERSION );
	wp_enqueue_script( 'cn-main', get_template_directory_uri() . '/assets/js/main.js', array(), CN_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
} );

add_action( 'widgets_init', function () {
	register_sidebar( array(
		'name'          => __( 'Footer notice', 'casanorte' ),
		'id'            => 'footer-notice',
		'before_widget' => '<div class="footer-widget">',
		'after_widget'  => '</div>',
		'before_title'  => '<h3>',
		'after_title'   => '</h3>',
	) );
} );

/** Agency details are editable in Appearance > Customize > Agency. */
function cn_defaults() {
	return array(
		'phone'   => '(41) 3000-0222',
		'address' => 'Av. Batel, 1450, sala 61 · Curitiba',
		'hours'   => 'Seg–Sex 9h–18h · Sáb 9h–13h',
		'creci'   => 'CRECI-PJ 00000 (fictício)',
	);
}

add_action( 'customize_register', function ( $wp_customize ) {
	$wp_customize->add_section( 'cn_info', array( 'title' => __( 'Agency', 'casanorte' ) ) );
	foreach ( cn_defaults() as $key => $default ) {
		$wp_customize->add_setting( "cn_$key", array( 'default' => $default, 'sanitize_callback' => 'sanitize_text_field' ) );
		$wp_customize->add_control( "cn_$key", array( 'label' => ucfirst( $key ), 'section' => 'cn_info', 'type' => 'text' ) );
	}
} );

function cn_opt( $key ) {
	$d = cn_defaults();
	return get_theme_mod( "cn_$key", $d[ $key ] );
}

/** Menu fallback used when no menu is assigned. */
function cn_fallback_menu() {
	$home = esc_url( home_url( '/' ) );
	echo '<ul class="menu">';
	printf( '<li><a href="%s">Imóveis</a></li>', esc_url( get_post_type_archive_link( 'imovel' ) ) );
	foreach ( array( 'bairros' => 'Bairros', 'servicos' => 'Como atuamos', 'contato' => 'Contato' ) as $id => $label ) {
		printf( '<li><a href="%s#%s">%s</a></li>', $home, esc_attr( $id ), esc_html( $label ) );
	}
	echo '</ul>';
}

/** Format a number as "R$ 1.250.000". */
function cn_money( $n ) {
	return 'R$ ' . number_format( (float) $n, 0, ',', '.' );
}

/** Listing price, with "/mês" for rentals. */
function cn_price( $post_id = 0 ) {
	$id = $post_id ? $post_id : get_the_ID();
	$p  = get_post_meta( $id, 'cn_preco', true );
	if ( '' === $p ) {
		return '';
	}
	return cn_money( $p ) . ( 'aluguel' === get_post_meta( $id, 'cn_finalidade', true ) ? '<small>/mês</small>' : '' );
}

/** Numeric spec (beds, baths...) or empty string. */
function cn_meta( $key, $post_id = 0 ) {
	return get_post_meta( $post_id ? $post_id : get_the_ID(), "cn_$key", true );
}

/** Deterministic building illustration (inline SVG, no image files). */
function cn_art( $seed = 1, $label = '' ) {
	$seed  = absint( $seed );
	$skies = array( array( '#CFE3E3', '#EEF3EE' ), array( '#E9D9BE', '#F6EEDD' ), array( '#C9D8E6', '#EDF1F4' ), array( '#DCD2C3', '#F3EEE6' ) );
	$walls = array( '#F7F3EA', '#E9DFCB', '#FFFFFF', '#DCE5E3' );
	$roofs = array( '#0F5C63', '#B98A3A', '#0B2433', '#8C4A2F' );
	list( $s1, $s2 ) = $skies[ $seed % 4 ];
	$wall = $walls[ ( $seed + 1 ) % 4 ];
	$roof = $roofs[ ( $seed + 2 ) % 4 ];
	$out  = '<svg class="art" viewBox="0 0 400 300" role="img" aria-label="' . esc_attr( $label ) . '" preserveAspectRatio="xMidYMid slice">';
	$out .= '<defs><linearGradient id="sk' . $seed . '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' . $s1 . '"/><stop offset="1" stop-color="' . $s2 . '"/></linearGradient></defs>';
	$out .= '<rect width="400" height="300" fill="url(#sk' . $seed . ')"/><circle cx="' . ( 300 + $seed % 60 ) . '" cy="62" r="26" fill="#fff" opacity=".7"/>';
	$out .= '<path d="M0 250 Q100 225 200 245 T400 240 V300 H0z" fill="#9DB89F"/><rect y="262" width="400" height="38" fill="#7FA085"/>';
	if ( $seed % 3 === 0 ) { // tower
		$out .= '<rect x="130" y="60" width="140" height="205" fill="' . $wall . '"/><rect x="130" y="60" width="140" height="12" fill="' . $roof . '"/>';
		for ( $r = 0; $r < 6; $r++ ) {
			for ( $c = 0; $c < 4; $c++ ) {
				$out .= '<rect x="' . ( 144 + $c * 32 ) . '" y="' . ( 84 + $r * 28 ) . '" width="18" height="16" rx="2" fill="' . ( ( $r + $c + $seed ) % 5 === 0 ? '#F2C66B' : '#7FA6B0' ) . '"/>';
			}
		}
		$out .= '<rect x="188" y="236" width="24" height="29" fill="' . $roof . '"/>';
	} else { // house
		$out .= '<rect x="100" y="140" width="200" height="125" fill="' . $wall . '"/><path d="M85 144 L200 70 L315 144z" fill="' . $roof . '"/>';
		$out .= '<rect x="182" y="198" width="36" height="67" rx="2" fill="' . $roof . '"/><rect x="120" y="168" width="44" height="40" rx="2" fill="#7FA6B0"/><rect x="236" y="168" width="44" height="40" rx="2" fill="#F2C66B"/>';
		$out .= '<rect x="270" y="90" width="18" height="40" fill="' . $wall . '"/>';
	}
	return $out . '<ellipse cx="' . ( 60 + $seed % 30 ) . '" cy="245" rx="26" ry="30" fill="#5E8A66"/><rect x="' . ( 58 + $seed % 30 ) . '" y="262" width="4" height="12" fill="#5B4632"/></svg>';
}
