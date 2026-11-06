<?php
/**
 * Menu dishes (prato) + section taxonomy (secao), and private table bookings (reserva).
 *
 * @package tacho
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', function () {
	register_post_type( 'prato', array(
		'labels'       => array(
			'name'          => __( 'Menu', 'tacho' ),
			'singular_name' => __( 'Dish', 'tacho' ),
			'add_new_item'  => __( 'Add new dish', 'tacho' ),
		),
		'public'       => true,
		'has_archive'  => 'cardapio',
		'rewrite'      => array( 'slug' => 'cardapio' ),
		'menu_icon'    => 'dashicons-food',
		'show_in_rest' => true,
		'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes' ),
	) );
	register_taxonomy( 'secao', 'prato', array(
		'labels'       => array( 'name' => __( 'Sections', 'tacho' ), 'singular_name' => __( 'Section', 'tacho' ) ),
		'hierarchical' => true,
		'public'       => true,
		'rewrite'      => array( 'slug' => 'secao' ),
		'show_in_rest' => true,
	) );
	// Bookings are never public: admin list only.
	register_post_type( 'reserva', array(
		'labels'       => array( 'name' => __( 'Bookings', 'tacho' ), 'singular_name' => __( 'Booking', 'tacho' ) ),
		'public'       => false,
		'show_ui'      => true,
		'menu_icon'    => 'dashicons-calendar-alt',
		'supports'     => array( 'title' ),
	) );
	foreach ( array( 'tacho_preco', 'tacho_tag', 'tacho_destaque' ) as $key ) {
		register_post_meta( 'prato', $key, array(
			'type'              => 'string',
			'single'            => true,
			'show_in_rest'      => true,
			'sanitize_callback' => 'sanitize_text_field',
		) );
	}
} );

add_action( 'add_meta_boxes', function () {
	add_meta_box( 'tacho_dish', __( 'Dish details', 'tacho' ), function ( $post ) {
		wp_nonce_field( 'tacho_meta', 'tacho_meta_nonce' );
		$price = esc_attr( get_post_meta( $post->ID, 'tacho_preco', true ) );
		$tag   = esc_attr( get_post_meta( $post->ID, 'tacho_tag', true ) );
		$feat  = get_post_meta( $post->ID, 'tacho_destaque', true );
		echo '<p><label>' . esc_html__( 'Price (R$, digits only)', 'tacho' ) . '<input type="number" min="0" step="1" name="tacho_preco" value="' . $price . '" class="widefat"></label></p>';
		echo '<p><label>' . esc_html__( 'Tag (e.g. Vegetarian)', 'tacho' ) . '<input type="text" name="tacho_tag" value="' . $tag . '" class="widefat"></label></p>';
		echo '<p><label><input type="checkbox" name="tacho_destaque" value="1" ' . checked( $feat, '1', false ) . '> ' . esc_html__( 'Show on the home page', 'tacho' ) . '</label></p>';
	}, 'prato', 'side' );
} );

add_action( 'save_post_prato', function ( $id ) {
	if ( ! isset( $_POST['tacho_meta_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['tacho_meta_nonce'] ), 'tacho_meta' ) || ! current_user_can( 'edit_post', $id ) ) {
		return;
	}
	update_post_meta( $id, 'tacho_preco', absint( $_POST['tacho_preco'] ?? 0 ) );
	update_post_meta( $id, 'tacho_tag', sanitize_text_field( wp_unslash( $_POST['tacho_tag'] ?? '' ) ) );
	update_post_meta( $id, 'tacho_destaque', empty( $_POST['tacho_destaque'] ) ? '' : '1' );
} );

/** The menu archive follows the manual order and lists every dish. */
add_action( 'pre_get_posts', function ( $q ) {
	if ( ! is_admin() && $q->is_main_query() && $q->is_post_type_archive( 'prato' ) ) {
		$q->set( 'orderby', 'menu_order title' );
		$q->set( 'order', 'ASC' );
		$q->set( 'posts_per_page', -1 );
	}
} );
