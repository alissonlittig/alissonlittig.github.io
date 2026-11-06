<?php
/**
 * Single dish.
 *
 * @package tacho
 */

get_header();
while ( have_posts() ) :
	the_post();
	$tag = get_post_meta( get_the_ID(), 'tacho_tag', true );
	$sec = get_the_terms( get_the_ID(), 'secao' );
	?>
<article class="wrap single">
	<nav class="crumbs" aria-label="Você está em"><a href="<?php echo esc_url( get_post_type_archive_link( 'prato' ) ); ?>">Cardápio</a><?php if ( $sec && ! is_wp_error( $sec ) ) : ?> · <?php echo esc_html( $sec[0]->name ); ?><?php endif; ?></nav>
	<div class="single-grid">
		<div class="single-pic"><?php echo tacho_art( get_the_ID(), get_the_title() ); // phpcs:ignore WordPress.Security.EscapeOutput ?></div>
		<div>
			<h1><?php the_title(); ?></h1>
			<?php if ( $tag ) : ?><p class="chip"><?php echo esc_html( $tag ); ?></p><?php endif; ?>
			<p class="price big"><?php echo esc_html( tacho_price() ); ?></p>
			<div class="entry"><?php the_content(); ?></div>
			<p><a class="btn" href="<?php echo esc_url( home_url( '/#reservas' ) ); ?>">Reservar mesa</a></p>
		</div>
	</div>
</article>
	<?php
endwhile;
get_footer();
