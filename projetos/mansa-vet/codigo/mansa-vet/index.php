<?php
/**
 * Fallback template (blog index, archives, search).
 *
 * @package mansa
 */

get_header();
?>
<div class="wrap page">
	<h1><?php echo is_search() ? 'Busca' : esc_html( get_the_archive_title() ?: 'Novidades' ); ?></h1>
	<?php if ( have_posts() ) : ?>
		<div class="card-grid">
			<?php
			while ( have_posts() ) :
				the_post();
				?>
				<article class="card">
					<h3><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h3>
					<p><?php echo esc_html( get_the_excerpt() ); ?></p>
				</article>
			<?php endwhile; ?>
		</div>
		<?php the_posts_pagination(); ?>
	<?php else : ?>
		<p>Nada por aqui ainda.</p>
	<?php endif; ?>
</div>
<?php
get_footer();
