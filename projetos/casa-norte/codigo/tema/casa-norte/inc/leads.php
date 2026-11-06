<?php
/**
 * Interest form: admin-post handler with nonce, honeypot and server-side validation.
 * Valid requests are stored as private "lead" posts (admin only).
 *
 * @package casanorte
 */

defined( 'ABSPATH' ) || exit;

/** Validate a lead. Returns array( clean values, error code or '' ). Pure, unit-testable. */
function cn_validate_lead( array $in ) {
	$v = array(
		'nome'     => trim( preg_replace( '/\s+/', ' ', wp_strip_all_tags( (string) ( $in['nome'] ?? '' ) ) ) ),
		'email'    => trim( (string) ( $in['email'] ?? '' ) ),
		'fone'     => preg_replace( '/\D+/', '', (string) ( $in['telefone'] ?? '' ) ),
		'mensagem' => mb_substr( trim( wp_strip_all_tags( (string) ( $in['mensagem'] ?? '' ) ) ), 0, 600 ),
		'imovel'   => absint( $in['imovel'] ?? 0 ),
	);
	if ( ! empty( $in['website'] ) ) {
		return array( $v, 'spam' );
	}
	if ( mb_strlen( $v['nome'] ) < 2 ) {
		return array( $v, 'nome' );
	}
	if ( ! filter_var( $v['email'], FILTER_VALIDATE_EMAIL ) ) {
		return array( $v, 'email' );
	}
	if ( '' !== $v['fone'] && ( strlen( $v['fone'] ) < 10 || strlen( $v['fone'] ) > 13 ) ) {
		return array( $v, 'telefone' );
	}
	return array( $v, '' );
}

function cn_handle_lead() {
	$back = wp_get_referer() ? remove_query_arg( 'contato', wp_get_referer() ) : home_url( '/' );
	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_key( $_POST['_wpnonce'] ), 'cn_lead' ) ) {
		wp_safe_redirect( add_query_arg( 'contato', 'nonce', $back ) . '#contato' );
		exit;
	}
	list( $v, $err ) = cn_validate_lead( wp_unslash( $_POST ) );
	if ( $err ) {
		wp_safe_redirect( add_query_arg( 'contato', $err, $back ) . '#contato' );
		exit;
	}
	$ref = $v['imovel'] ? get_the_title( $v['imovel'] ) : 'Contato geral';
	wp_insert_post( array(
		'post_type'   => 'lead',
		'post_status' => 'publish',
		'post_title'  => $v['nome'] . ' · ' . $ref,
		'meta_input'  => array( 'cn_email' => $v['email'], 'cn_fone' => $v['fone'], 'cn_msg' => $v['mensagem'] ),
	) );
	wp_mail( get_option( 'admin_email' ), '[Casa Norte] Interesse: ' . $ref, "{$v['nome']} <{$v['email']}> {$v['fone']}\n\n{$v['mensagem']}" );
	wp_safe_redirect( add_query_arg( 'contato', 'ok', $back ) . '#contato' );
	exit;
}
add_action( 'admin_post_nopriv_cn_lead', 'cn_handle_lead' );
add_action( 'admin_post_cn_lead', 'cn_handle_lead' );

/** Human message for the ?contato= flag. */
function cn_lead_message( $code ) {
	$map = array(
		'nome'     => 'Informe seu nome.',
		'email'    => 'E-mail inválido.',
		'telefone' => 'Telefone inválido. Use DDD + número.',
		'nonce'    => 'A página expirou. Recarregue e tente de novo.',
		'spam'     => 'Não foi possível enviar.',
	);
	return $map[ $code ] ?? '';
}
