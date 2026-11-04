<?php
/**
 * Mansa Vet theme setup.
 *
 * @package mansa
 */

defined( 'ABSPATH' ) || exit;

define( 'MANSA_VERSION', '1.0.0' );

require get_template_directory() . '/inc/post-types.php';
require get_template_directory() . '/inc/contact-form.php';

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'gallery', 'caption', 'style', 'script' ) );
	add_theme_support( 'custom-logo', array( 'height' => 48, 'width' => 160, 'flex-width' => true ) );
	add_theme_support( 'editor-styles' );
	add_editor_style( 'assets/css/main.css' );
	register_nav_menus( array(
		'primary' => __( 'Primary menu', 'mansa' ),
		'footer'  => __( 'Footer menu', 'mansa' ),
	) );
} );

add_action( 'wp_enqueue_scripts', function () {
	wp_enqueue_style( 'mansa-main', get_template_directory_uri() . '/assets/css/main.css', array(), MANSA_VERSION );
	wp_enqueue_script( 'mansa-main', get_template_directory_uri() . '/assets/js/main.js', array(), MANSA_VERSION, array( 'strategy' => 'defer', 'in_footer' => true ) );
} );

add_action( 'widgets_init', function () {
	register_sidebar( array(
		'name'          => __( 'Footer notice', 'mansa' ),
		'id'            => 'footer-notice',
		'before_widget' => '<div class="footer-widget">',
		'after_widget'  => '</div>',
		'before_title'  => '<h3>',
		'after_title'   => '</h3>',
	) );
} );

/** Contact details are editable in Appearance > Customize > Clinic contact. */
function mansa_defaults() {
	return array(
		'phone'   => '(41) 3000-0000',
		'address' => 'Rua das Acácias, 128 · Curitiba',
		'hours'   => 'Seg–Sex 8h–20h · Sáb 8h–14h',
	);
}

add_action( 'customize_register', function ( $wp_customize ) {
	$wp_customize->add_section( 'mansa_contact', array( 'title' => __( 'Clinic contact', 'mansa' ) ) );
	foreach ( mansa_defaults() as $key => $default ) {
		$wp_customize->add_setting( "mansa_$key", array( 'default' => $default, 'sanitize_callback' => 'sanitize_text_field' ) );
		$wp_customize->add_control( "mansa_$key", array( 'label' => ucfirst( $key ), 'section' => 'mansa_contact', 'type' => 'text' ) );
	}
} );

function mansa_opt( $key ) {
	$d = mansa_defaults();
	return get_theme_mod( "mansa_$key", $d[ $key ] );
}

/** Menu fallback used when no menu is assigned: the one-page anchors. */
function mansa_fallback_menu() {
	$home = esc_url( home_url( '/' ) );
	echo '<ul class="menu">';
	foreach ( array( 'servicos' => 'Serviços', 'equipe' => 'Equipe', 'depoimentos' => 'Histórias', 'contato' => 'Contato' ) as $id => $label ) {
		printf( '<li><a href="%s#%s">%s</a></li>', $home, esc_attr( $id ), esc_html( $label ) );
	}
	echo '</ul>';
}
