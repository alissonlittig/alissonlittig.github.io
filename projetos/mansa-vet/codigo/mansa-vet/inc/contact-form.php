<?php
/**
 * Appointment request form: admin-post handler with nonce, honeypot and validation.
 *
 * @package mansa
 */

defined( 'ABSPATH' ) || exit;

function mansa_handle_contact() {
	$back = wp_get_referer() ? wp_get_referer() : home_url( '/' );
	$fail = add_query_arg( 'sent', 'error', $back ) . '#contato';

	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['_wpnonce'] ), 'mansa_contact' ) ) {
		wp_safe_redirect( $fail );
		exit;
	}
	$name  = sanitize_text_field( wp_unslash( $_POST['nome'] ?? '' ) );
	$pet   = sanitize_text_field( wp_unslash( $_POST['pet'] ?? '' ) );
	$phone = sanitize_text_field( wp_unslash( $_POST['telefone'] ?? '' ) );
	$msg   = sanitize_textarea_field( wp_unslash( $_POST['mensagem'] ?? '' ) );
	$honey = sanitize_text_field( wp_unslash( $_POST['website'] ?? '' ) );

	if ( $honey || '' === $name || '' === $phone ) {
		wp_safe_redirect( $fail );
		exit;
	}
	wp_mail( get_option( 'admin_email' ), '[Mansa] Pedido de consulta de ' . $name, "Name: $name\nPet: $pet\nPhone: $phone\n\n$msg" );
	wp_safe_redirect( add_query_arg( 'sent', 'ok', $back ) . '#contato' );
	exit;
}
add_action( 'admin_post_nopriv_mansa_contact', 'mansa_handle_contact' );
add_action( 'admin_post_mansa_contact', 'mansa_handle_contact' );
