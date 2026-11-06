<?php
/**
 * Home: hero, featured dishes, house story, booking.
 *
 * @package tacho
 */

get_header();

get_template_part( 'template-parts/hero' );

$featured = new WP_Query( array(
	'post_type'      => 'prato',
	'posts_per_page' => 3,
	'orderby'        => 'menu_order title',
	'order'          => 'ASC',
	'meta_key'       => 'tacho_destaque', // phpcs:ignore WordPress.DB.SlowDBQuery
	'meta_value'     => '1', // phpcs:ignore WordPress.DB.SlowDBQuery
) );
?>
<section class="section" id="destaques">
	<div class="wrap">
		<p class="eyebrow">Da panela de ferro</p>
		<h2>Os pratos que a casa faz melhor</h2>
		<div class="dish-grid featured">
			<?php
			while ( $featured->have_posts() ) {
				$featured->the_post();
				get_template_part( 'template-parts/card-prato' );
			}
			wp_reset_postdata();
			?>
		</div>
		<p class="center"><a class="btn btn-ghost" href="<?php echo esc_url( get_post_type_archive_link( 'prato' ) ); ?>">Ver o cardápio completo</a></p>
	</div>
</section>

<?php get_template_part( 'template-parts/historia' ); ?>
<?php get_template_part( 'template-parts/reserva' ); ?>

<?php
get_footer();
