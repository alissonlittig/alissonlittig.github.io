<?php
/**
 * Table booking: admin-post handler with nonce, honeypot and server-side validation.
 * Valid requests are stored as private "reserva" posts (visible only in the admin).
 *
 * @package tacho
 */

defined( 'ABSPATH' ) || exit;

/** Time slots offered by the form (also validated server-side). */
function tacho_slots() {
	return array( '12:00', '12:30', '13:00', '13:30', '14:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30' );
}

/**
 * Validate a booking request. Returns array( clean values, error code or '' ).
 * Pure function: no WordPress state besides wp_strip_all_tags, easy to unit-test.
 */
function tacho_validate_booking( array $in, $today = null ) {
	$today = $today ? $today : gmdate( 'Y-m-d' );
	$v     = array(
		'nome'    => trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( (string) ( $in['nome'] ?? '' ) ) ) ),
		'fone'    => preg_replace( '/\D+/', '', (string) ( $in['telefone'] ?? '' ) ),
		'data'    => (string) ( $in['data'] ?? '' ),
		'hora'    => (string) ( $in['hora'] ?? '' ),
		'pessoas' => (int) ( $in['pessoas'] ?? 0 ),
		'obs'     => trim( wp_strip_all_tags( (string) ( $in['obs'] ?? '' ) ) ),
	);
	if ( ! empty( $in['website'] ) ) {
		return array( $v, 'spam' );
	}
	if ( mb_strlen( $v['nome'] ) < 2 ) {
		return array( $v, 'nome' );
	}
	if ( strlen( $v['fone'] ) < 10 || strlen( $v['fone'] ) > 13 ) {
		return array( $v, 'telefone' );
	}
	$d = DateTime::createFromFormat( 'Y-m-d', $v['data'] );
	if ( ! $d || $d->format( 'Y-m-d' ) !== $v['data'] || $v['data'] < $today || $v['data'] > gmdate( 'Y-m-d', strtotime( $today . ' +90 days' ) ) ) {
		return array( $v, 'data' );
	}
	if ( ! in_array( $v['hora'], tacho_slots(), true ) ) {
		return array( $v, 'hora' );
	}
	if ( $v['pessoas'] < 1 || $v['pessoas'] > 12 ) {
		return array( $v, 'pessoas' );
	}
	$v['obs'] = mb_substr( $v['obs'], 0, 400 );
	return array( $v, '' );
}

function tacho_handle_booking() {
	$back = wp_get_referer() ? remove_query_arg( 'reserva', wp_get_referer() ) : home_url( '/' );
	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['_wpnonce'] ), 'tacho_booking' ) ) {
		wp_safe_redirect( add_query_arg( 'reserva', 'nonce', $back ) . '#reservas' );
		exit;
	}
	list( $v, $err ) = tacho_validate_booking( wp_unslash( $_POST ) );
	if ( $err ) {
		wp_safe_redirect( add_query_arg( 'reserva', $err, $back ) . '#reservas' );
		exit;
	}
	wp_insert_post( array(
		'post_type'   => 'reserva',
		'post_status' => 'publish',
		'post_title'  => sprintf( '%s · %s %s · %d pessoas', $v['nome'], $v['data'], $v['hora'], $v['pessoas'] ),
		'meta_input'  => array( 'tacho_fone' => $v['fone'], 'tacho_obs' => $v['obs'] ),
	) );
	wp_mail( get_option( 'admin_email' ), '[Tacho] Reserva de ' . $v['nome'], "{$v['data']} {$v['hora']} · {$v['pessoas']} pessoas\nTel: {$v['fone']}\n{$v['obs']}" );
	wp_safe_redirect( add_query_arg( 'reserva', 'ok', $back ) . '#reservas' );
	exit;
}
add_action( 'admin_post_nopriv_tacho_booking', 'tacho_handle_booking' );
add_action( 'admin_post_tacho_booking', 'tacho_handle_booking' );

/** Human message for the ?reserva= flag. */
function tacho_booking_message( $code ) {
	$map = array(
		'nome'     => 'Informe seu nome.',
		'telefone' => 'Telefone inválido. Use DDD + número.',
		'data'     => 'Escolha uma data entre hoje e os próximos 90 dias.',
		'hora'     => 'Escolha um dos horários disponíveis.',
		'pessoas'  => 'Reservas online são de 1 a 12 pessoas.',
		'nonce'    => 'A página expirou. Recarregue e tente de novo.',
		'spam'     => 'Não foi possível enviar.',
	);
	return $map[ $code ] ?? '';
}
