<?php
/**
 * Custom post types: Service (servico) and Team member (profissional).
 *
 * @package mansa
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', function () {
	register_post_type( 'servico', array(
		'labels'       => array(
			'name'          => __( 'Services', 'mansa' ),
			'singular_name' => __( 'Service', 'mansa' ),
			'add_new_item'  => __( 'Add new service', 'mansa' ),
		),
		'public'       => true,
		'has_archive'  => 'servicos',
		'rewrite'      => array( 'slug' => 'servicos' ),
		'menu_icon'    => 'dashicons-heart',
		'show_in_rest' => true,
		'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes' ),
	) );
	register_post_type( 'profissional', array(
		'labels'       => array(
			'name'          => __( 'Team', 'mansa' ),
			'singular_name' => __( 'Vet', 'mansa' ),
		),
		'public'       => true,
		'has_archive'  => false,
		'rewrite'      => array( 'slug' => 'equipe' ),
		'menu_icon'    => 'dashicons-groups',
		'show_in_rest' => true,
		'supports'     => array( 'title', 'editor', 'thumbnail', 'page-attributes' ),
	) );
	foreach ( array( 'servico' => 'mansa_price_from', 'profissional' => 'mansa_role' ) as $type => $key ) {
		register_post_meta( $type, $key, array(
			'type'              => 'string',
			'single'            => true,
			'show_in_rest'      => true,
			'sanitize_callback' => 'sanitize_text_field',
		) );
	}
} );

add_action( 'add_meta_boxes', function () {
	$box = function ( $key ) {
		return function ( $post ) use ( $key ) {
			wp_nonce_field( 'mansa_meta', 'mansa_meta_nonce' );
			printf( '<input type="text" name="%s" value="%s" class="widefat">', esc_attr( $key ), esc_attr( get_post_meta( $post->ID, $key, true ) ) );
		};
	};
	add_meta_box( 'mansa_price', __( 'Starting price', 'mansa' ), $box( 'mansa_price_from' ), 'servico', 'side' );
	add_meta_box( 'mansa_role', __( 'Role / CRMV', 'mansa' ), $box( 'mansa_role' ), 'profissional', 'side' );
} );

add_action( 'save_post', function ( $id ) {
	if ( ! isset( $_POST['mansa_meta_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['mansa_meta_nonce'] ), 'mansa_meta' ) || ! current_user_can( 'edit_post', $id ) ) {
		return;
	}
	foreach ( array( 'mansa_price_from', 'mansa_role' ) as $k ) {
		if ( isset( $_POST[ $k ] ) ) {
			update_post_meta( $id, $k, sanitize_text_field( wp_unslash( $_POST[ $k ] ) ) );
		}
	}
} );

/** Services archive follows the manual order set in the editor. */
add_action( 'pre_get_posts', function ( $q ) {
	if ( ! is_admin() && $q->is_main_query() && $q->is_post_type_archive( 'servico' ) ) {
		$q->set( 'orderby', 'menu_order title' );
		$q->set( 'order', 'ASC' );
		$q->set( 'posts_per_page', -1 );
	}
} );
