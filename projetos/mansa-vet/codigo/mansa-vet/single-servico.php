<?php
/**
 * Single service.
 *
 * @package mansa
 */

get_header();
while ( have_posts() ) :
	the_post();
	$price = get_post_meta( get_the_ID(), 'mansa_price_from', true );
	?>
<article class="wrap page narrow">
	<p class="eyebrow"><a href="<?php echo esc_url( get_post_type_archive_link( 'servico' ) ); ?>">← Todos os serviços</a></p>
	<h1><?php the_title(); ?></h1>
	<?php if ( $price ) : ?><p class="price">a partir de <strong><?php echo esc_html( $price ); ?></strong></p><?php endif; ?>
	<div class="prose"><?php the_content(); ?></div>
	<a class="btn" href="<?php echo esc_url( home_url( '/#contato' ) ); ?>">Agendar consulta</a>
</article>
<?php
endwhile;
get_footer();
