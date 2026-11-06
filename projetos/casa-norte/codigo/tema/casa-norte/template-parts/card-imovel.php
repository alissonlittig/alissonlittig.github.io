<?php
$id    = get_the_ID();
$tipo  = get_the_terms( $id, 'tipo' );
$bai   = get_the_terms( $id, 'bairro' );
$tipo  = $tipo && ! is_wp_error( $tipo ) ? $tipo[0] : null;
$bai   = $bai && ! is_wp_error( $bai ) ? $bai[0] : null;
$fin   = cn_meta( 'finalidade' );
?>
<article class="listing"
	data-tipo="<?php echo esc_attr( $tipo ? $tipo->slug : '' ); ?>"
	data-bairro="<?php echo esc_attr( $bai ? $bai->slug : '' ); ?>"
	data-finalidade="<?php echo esc_attr( $fin ); ?>"
	data-quartos="<?php echo esc_attr( (int) cn_meta( 'quartos' ) ); ?>"
	data-preco="<?php echo esc_attr( (int) cn_meta( 'preco' ) ); ?>">
	<a class="listing-pic" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
		<?php echo cn_art( $id, '' ); // phpcs:ignore WordPress.Security.EscapeOutput ?>
		<span class="badge"><?php echo 'aluguel' === $fin ? 'Aluguel' : 'Venda'; ?></span>
	</a>
	<div class="listing-body">
		<p class="where"><?php echo esc_html( ( $tipo ? $tipo->name : '' ) . ( $bai ? ' · ' . $bai->name : '' ) ); ?></p>
		<h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
		<p class="price"><?php echo wp_kses( cn_price(), array( 'small' => array() ) ); ?></p>
		<ul class="specs" aria-label="Características">
			<li><strong><?php echo esc_html( cn_meta( 'quartos' ) ? cn_meta( 'quartos' ) : '—' ); ?></strong> quartos</li>
			<li><strong><?php echo esc_html( cn_meta( 'area' ) ? cn_meta( 'area' ) : '—' ); ?></strong> m²</li>
			<li><strong><?php echo esc_html( cn_meta( 'vagas' ) ? cn_meta( 'vagas' ) : '0' ); ?></strong> vagas</li>
		</ul>
	</div>
</article>
