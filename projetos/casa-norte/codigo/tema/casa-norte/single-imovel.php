<?php
/**
 * Single listing.
 *
 * @package casanorte
 */

get_header();
while ( have_posts() ) :
	the_post();
	$id   = get_the_ID();
	$tipo = get_the_terms( $id, 'tipo' );
	$bai  = get_the_terms( $id, 'bairro' );
	?>
<article class="wrap single">
	<nav class="crumbs" aria-label="Você está em"><a href="<?php echo esc_url( get_post_type_archive_link( 'imovel' ) ); ?>">Imóveis</a><?php if ( $bai && ! is_wp_error( $bai ) ) : ?> · <?php echo esc_html( $bai[0]->name ); ?><?php endif; ?></nav>
	<div class="single-grid">
		<div class="single-pic"><?php echo cn_art( $id, get_the_title() ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
		<div>
			<p class="where"><?php echo esc_html( ( $tipo && ! is_wp_error( $tipo ) ? $tipo[0]->name : '' ) . ' · ' . ( 'aluguel' === cn_meta( 'finalidade' ) ? 'Aluguel' : 'Venda' ) ); ?></p>
			<h1><?php the_title(); ?></h1>
			<p class="price big"><?php echo wp_kses( cn_price(), array( 'small' => array() ) ); ?></p>
			<ul class="specs big" aria-label="Características">
				<li><strong><?php echo esc_html( cn_meta( 'quartos' ) ? cn_meta( 'quartos' ) : '—' ); ?></strong> quartos</li>
				<li><strong><?php echo esc_html( cn_meta( 'banheiros' ) ? cn_meta( 'banheiros' ) : '—' ); ?></strong> banheiros</li>
				<li><strong><?php echo esc_html( cn_meta( 'area' ) ? cn_meta( 'area' ) : '—' ); ?></strong> m²</li>
				<li><strong><?php echo esc_html( cn_meta( 'vagas' ) ? cn_meta( 'vagas' ) : '0' ); ?></strong> vagas</li>
			</ul>
			<div class="entry"><?php the_content(); ?></div>
			<p><a class="btn" href="#contato">Quero visitar</a></p>
		</div>
	</div>
</article>
	<?php
	get_template_part( 'template-parts/contato', null, array( 'imovel' => $id ) );
endwhile;
get_footer();
