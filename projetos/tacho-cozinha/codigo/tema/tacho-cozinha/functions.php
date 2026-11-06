<?php
/**
 * Tacho Cozinha theme setup.
 *
 * @package tacho
 */

defined( 'ABSPATH' ) || exit;

define( 'TACHO_VERSION', '1.0.0' );

require get_template_directory() . '/inc/post-types.php';
require get_template_directory() . '/inc/reservation.php';

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/main.css' );
	register_nav_menus( array(
		'primary' => __( 'Primary menu', 'tacho' ),
		'footer'  => __( 'Footer menu', 'tacho' ),
	) );
} );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'tacho-main', get_template_directory_uri() . '/assets/css/main.css', array(), TACHO_VERSION );
	wp_enqueue_script( 'tacho-main', get_template_directory_uri() . '/assets/js/main.js', array(), TACHO_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
} );

add_action( 'widgets_init', function () {
	register_sidebar( array(
		'name'          => __( 'Footer notice', 'tacho' ),
		'id'            => 'footer-notice',
		'before_widget' => '<div class="footer-widget">',
		'after_widget'  => '</div>',
		'before_title'  => '<h3>',
		'after_title'   => '</h3>',
	) );
} );

/** Contact details are editable in Appearance > Customize > Restaurant. */
function tacho_defaults() {
	return array(
		'phone'   => '(41) 3000-0147',
		'address' => 'Rua Mateus Leme, 410 · São Francisco · Curitiba',
		'hours'   => 'Ter–Sáb 12h–15h e 19h–23h · Dom 12h–17h',
	);
}

add_action( 'customize_register', function ( $wp_customize ) {
	$wp_customize->add_section( 'tacho_info', array( 'title' => __( 'Restaurant', 'tacho' ) ) );
	foreach ( tacho_defaults() as $key => $default ) {
		$wp_customize->add_setting( "tacho_$key", array( 'default' => $default, 'sanitize_callback' => 'sanitize_text_field' ) );
		$wp_customize->add_control( "tacho_$key", array( 'label' => ucfirst( $key ), 'section' => 'tacho_info', 'type' => 'text' ) );
	}
} );

function tacho_opt( $key ) {
	$d = tacho_defaults();
	return get_theme_mod( "tacho_$key", $d[ $key ] );
}

/** Menu fallback used when no menu is assigned. */
function tacho_fallback_menu() {
	$home = esc_url( home_url( '/' ) );
	echo '<ul class="menu">';
	printf( '<li><a href="%s">Cardápio</a></li>', esc_url( get_post_type_archive_link( 'prato' ) ) );
	foreach ( array( 'destaques' => 'Destaques', 'historia' => 'A casa', 'reservas' => 'Reservas' ) as $id => $label ) {
		printf( '<li><a href="%s#%s">%s</a></li>', $home, esc_attr( $id ), esc_html( $label ) );
	}
	echo '</ul>';
}

/** Dish price as "R$ 48". Stored as plain digits so it can be sorted later. */
function tacho_price( $post_id = 0 ) {
	$v = get_post_meta( $post_id ? $post_id : get_the_ID(), 'tacho_preco', true );
	return '' === $v ? '' : 'R$ ' . number_format_i18n( (float) $v, 0 );
}

/** Deterministic plate illustration (inline SVG, no image files). */
function tacho_art( $seed = 1, $label = '' ) {
	$seed  = absint( $seed );
	$bgs   = array( '#E9DBC2', '#DCC9A6', '#E6D2B4', '#D8C7A0' );
	$foods = array( '#A8381A', '#C9973B', '#3F4A2C', '#7A5230', '#D97B3D', '#8A9A5B' );
	$out   = '<svg class="art" viewBox="0 0 400 300" role="img" aria-label="' . esc_attr( $label ) . '" preserveAspectRatio="xMidYMid slice"><rect width="400" height="300" fill="' . $bgs[ $seed % 4 ] . '"/>';
	$out  .= '<circle cx="200" cy="150" r="118" fill="#FBF6EA"/><circle cx="200" cy="150" r="96" fill="none" stroke="#E4D6B8" stroke-width="2"/>';
	for ( $i = 0; $i < 4; $i++ ) {
		$a    = ( $seed * 53 + $i * 97 ) % 360;
		$r    = 22 + ( $seed * 7 + $i * 11 ) % 34;
		$cx   = 200 + (int) ( cos( deg2rad( $a ) ) * ( 18 + $i * 9 ) );
		$cy   = 150 + (int) ( sin( deg2rad( $a ) ) * ( 14 + $i * 8 ) );
		$out .= sprintf( '<ellipse cx="%d" cy="%d" rx="%d" ry="%d" fill="%s" opacity=".92" transform="rotate(%d %d %d)"/>', $cx, $cy, $r, (int) ( $r * 0.72 ), $foods[ ( $seed + $i * 2 ) % 6 ], $a, $cx, $cy );
	}
	return $out . '<circle cx="' . ( 188 + $seed % 24 ) . '" cy="' . ( 138 + $seed % 20 ) . '" r="6" fill="#FBF6EA" opacity=".7"/></svg>';
}
