<?php
/**
 * Listings (imovel) with type + neighborhood taxonomies, search filters, and private leads.
 *
 * @package casanorte
 */

defined( 'ABSPATH' ) || exit;

add_action( 'init', function () {
	register_post_type( 'imovel', array(
		'labels'       => array(
			'name'          => __( 'Listings', 'casanorte' ),
			'singular_name' => __( 'Listing', 'casanorte' ),
			'add_new_item'  => __( 'Add new listing', 'casanorte' ),
		),
		'public'       => true,
		'has_archive'  => 'imoveis',
		'rewrite'      => array( 'slug' => 'imoveis' ),
		'menu_icon'    => 'dashicons-admin-home',
		'show_in_rest' => true,
		'supports'     => array( 'title', 'editor', 'excerpt', 'thumbnail', 'page-attributes' ),
	) );
	foreach ( array( 'tipo' => 'Type', 'bairro' => 'Neighborhood' ) as $tax => $name ) {
		register_taxonomy( $tax, 'imovel', array(
			'labels'       => array( 'name' => $name, 'singular_name' => $name ),
			'hierarchical' => true,
			'public'       => true,
			'rewrite'      => array( 'slug' => $tax ),
			'show_in_rest' => true,
		) );
	}
	register_post_type( 'lead', array(
		'labels'   => array( 'name' => __( 'Leads', 'casanorte' ), 'singular_name' => __( 'Lead', 'casanorte' ) ),
		'public'   => false,
		'show_ui'  => true,
		'menu_icon' => 'dashicons-email-alt',
		'supports' => array( 'title' ),
	) );
	foreach ( cn_meta_keys() as $key ) {
		register_post_meta( 'imovel', "cn_$key", array(
			'type'              => 'string',
			'single'            => true,
			'show_in_rest'      => true,
			'sanitize_callback' => 'sanitize_text_field',
		) );
	}
} );

/** Listing fields: key => label. */
function cn_fields() {
	return array(
		'preco'      => 'Price (R$, digits only)',
		'quartos'    => 'Bedrooms',
		'banheiros'  => 'Bathrooms',
		'vagas'      => 'Parking spots',
		'area'       => 'Area (m²)',
		'finalidade' => 'Purpose: venda or aluguel',
	);
}

function cn_meta_keys() {
	return array_merge( array_keys( cn_fields() ), array( 'destaque' ) );
}

add_action( 'add_meta_boxes', function () {
	add_meta_box( 'cn_details', __( 'Listing details', 'casanorte' ), function ( $post ) {
		wp_nonce_field( 'cn_meta', 'cn_meta_nonce' );
		foreach ( cn_fields() as $key => $label ) {
			printf(
				'<p><label>%s<input type="text" name="cn_%s" value="%s" class="widefat"></label></p>',
				esc_html( $label ),
				esc_attr( $key ),
				esc_attr( get_post_meta( $post->ID, "cn_$key", true ) )
			);
		}
		printf( '<p><label><input type="checkbox" name="cn_destaque" value="1" %s> %s</label></p>', checked( get_post_meta( $post->ID, 'cn_destaque', true ), '1', false ), esc_html__( 'Show on the home page', 'casanorte' ) );
	}, 'imovel', 'side' );
} );

add_action( 'save_post_imovel', function ( $id ) {
	if ( ! isset( $_POST['cn_meta_nonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['cn_meta_nonce'] ), 'cn_meta' ) || ! current_user_can( 'edit_post', $id ) ) {
		return;
	}
	foreach ( array_keys( cn_fields() ) as $k ) {
		$val = sanitize_text_field( wp_unslash( $_POST[ "cn_$k" ] ?? '' ) );
		update_post_meta( $id, "cn_$k", 'finalidade' === $k ? ( 'aluguel' === $val ? 'aluguel' : 'venda' ) : preg_replace( '/[^0-9.]/', '', $val ) );
	}
	update_post_meta( $id, 'cn_destaque', empty( $_POST['cn_destaque'] ) ? '' : '1' );
} );

/**
 * Normalise the search filters from a query array (GET). Pure function, unit-testable.
 * Returns only the keys that are valid.
 */
function cn_clean_filters( array $in ) {
	$out = array();
	foreach ( array( 'tipo', 'bairro' ) as $k ) {
		if ( ! empty( $in[ $k ] ) && is_string( $in[ $k ] ) ) {
			$out[ $k ] = sanitize_title( $in[ $k ] );
		}
	}
	if ( isset( $in['finalidade'] ) && in_array( $in['finalidade'], array( 'venda', 'aluguel' ), true ) ) {
		$out['finalidade'] = $in['finalidade'];
	}
	foreach ( array( 'quartos', 'preco_max' ) as $k ) {
		if ( isset( $in[ $k ] ) && ctype_digit( (string) $in[ $k ] ) && (int) $in[ $k ] > 0 ) {
			$out[ $k ] = (int) $in[ $k ];
		}
	}
	return $out;
}

/** The listings archive: every listing, newest manual order first, filtered by the query string. */
add_action( 'pre_get_posts', function ( $q ) {
	if ( is_admin() || ! $q->is_main_query() || ! $q->is_post_type_archive( 'imovel' ) ) {
		return;
	}
	$f = cn_clean_filters( $_GET ); // phpcs:ignore WordPress.Security.NonceVerification
	$q->set( 'posts_per_page', -1 );
	$q->set( 'orderby', 'menu_order title' );
	$q->set( 'order', 'ASC' );
	$tax = array();
	foreach ( array( 'tipo', 'bairro' ) as $k ) {
		if ( isset( $f[ $k ] ) ) {
			$tax[] = array( 'taxonomy' => $k, 'field' => 'slug', 'terms' => $f[ $k ] );
		}
	}
	$meta = array();
	if ( isset( $f['finalidade'] ) ) {
		$meta[] = array( 'key' => 'cn_finalidade', 'value' => $f['finalidade'] );
	}
	if ( isset( $f['quartos'] ) ) {
		$meta[] = array( 'key' => 'cn_quartos', 'value' => $f['quartos'], 'compare' => '>=', 'type' => 'NUMERIC' );
	}
	if ( isset( $f['preco_max'] ) ) {
		$meta[] = array( 'key' => 'cn_preco', 'value' => $f['preco_max'], 'compare' => '<=', 'type' => 'NUMERIC' );
	}
	if ( $tax ) {
		$q->set( 'tax_query', $tax ); // phpcs:ignore WordPress.DB.SlowDBQuery
	}
	if ( $meta ) {
		$q->set( 'meta_query', $meta ); // phpcs:ignore WordPress.DB.SlowDBQuery
	}
} );
