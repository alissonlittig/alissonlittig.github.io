<?php
/**
 * Search filters (GET). Works server-side on the archive; main.js refines it live.
 * Pass args: array( 'compact' => bool ).
 */
$f     = cn_clean_filters( $_GET ); // phpcs:ignore WordPress.Security.NonceVerification
$tipos = get_terms( array( 'taxonomy' => 'tipo', 'hide_empty' => false ) );
$bairr = get_terms( array( 'taxonomy' => 'bairro', 'hide_empty' => false ) );
$sel   = function ( $key, $val ) use ( $f ) {
	return isset( $f[ $key ] ) && (string) $f[ $key ] === (string) $val ? ' selected' : '';
};
?>
<form class="filter" method="get" action="<?php echo esc_url( get_post_type_archive_link( 'imovel' ) ); ?>" role="search" aria-label="Buscar imóveis">
	<label>Quero
		<select name="finalidade">
			<option value="">Comprar ou alugar</option>
			<option value="venda"<?php echo $sel( 'finalidade', 'venda' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>>Comprar</option>
			<option value="aluguel"<?php echo $sel( 'finalidade', 'aluguel' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>>Alugar</option>
		</select>
	</label>
	<label>Tipo
		<select name="tipo">
			<option value="">Todos</option>
			<?php foreach ( $tipos as $t ) : ?><option value="<?php echo esc_attr( $t->slug ); ?>"<?php echo $sel( 'tipo', $t->slug ); // phpcs:ignore WordPress.Security.EscapeOutput ?>><?php echo esc_html( $t->name ); ?></option><?php endforeach; ?>
		</select>
	</label>
	<label>Bairro
		<select name="bairro">
			<option value="">Todos</option>
			<?php foreach ( $bairr as $t ) : ?><option value="<?php echo esc_attr( $t->slug ); ?>"<?php echo $sel( 'bairro', $t->slug ); // phpcs:ignore WordPress.Security.EscapeOutput ?>><?php echo esc_html( $t->name ); ?></option><?php endforeach; ?>
		</select>
	</label>
	<label>Quartos
		<select name="quartos">
			<option value="">Qualquer</option>
			<?php foreach ( array( 1, 2, 3, 4 ) as $n ) : ?><option value="<?php echo (int) $n; ?>"<?php echo $sel( 'quartos', $n ); // phpcs:ignore WordPress.Security.EscapeOutput ?>><?php echo (int) $n; ?>+</option><?php endforeach; ?>
		</select>
	</label>
	<label>Até
		<select name="preco_max">
			<option value="">Qualquer valor</option>
			<?php foreach ( array( 5000, 10000, 600000, 1000000, 2000000 ) as $n ) : ?><option value="<?php echo (int) $n; ?>"<?php echo $sel( 'preco_max', $n ); // phpcs:ignore WordPress.Security.EscapeOutput ?>><?php echo esc_html( cn_money( $n ) ); ?></option><?php endforeach; ?>
		</select>
	</label>
	<button class="btn" type="submit">Buscar</button>
</form>
