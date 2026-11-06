<?php
/**
 * Fallback template.
 *
 * @package tacho
 */

get_header();
?>
<section class="page-head"><div class="wrap"><h1><?php echo is_search() ? esc_html__( 'Busca', 'tacho' ) : esc_html( get_the_archive_title() ? get_the_archive_title() : get_bloginfo( 'name' ) ); ?></h1></div></section>
<div class="wrap section">
	<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
		<article class="entry"><h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2><?php the_excerpt(); ?></article>
	<?php endwhile; else : ?>
		<p>Nada encontrado.</p>
	<?php endif; ?>
</div>
<?php
get_footer();
