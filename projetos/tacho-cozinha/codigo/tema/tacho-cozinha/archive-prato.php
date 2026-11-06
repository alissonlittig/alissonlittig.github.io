<?php
/**
 * Full menu, grouped by section.
 *
 * @package tacho
 */

get_header();
$sections = get_terms( array( 'taxonomy' => 'secao', 'orderby' => 'term_id', 'hide_empty' => true ) );
?>
<section class="page-head">
	<div class="wrap">
		<p class="eyebrow">Cardápio</p>
		<h1>O que sai da cozinha</h1>
		<p class="lead">Preços em reais, por pessoa. Pratos do dia mudam conforme a feira.</p>
		<nav class="chips" aria-label="Seções do cardápio">
			<?php foreach ( $sections as $s ) : ?><a href="#<?php echo esc_attr( $s->slug ); ?>"><?php echo esc_html( $s->name ); ?></a><?php endforeach; ?>
		</nav>
	</div>
</section>
<?php foreach ( $sections as $s ) : ?>
<section class="section menu-section" id="<?php echo esc_attr( $s->slug ); ?>">
	<div class="wrap">
		<h2><?php echo esc_html( $s->name ); ?></h2>
		<div class="dish-grid">
			<?php
			$q = new WP_Query( array(
				'post_type'      => 'prato',
				'posts_per_page' => -1,
				'orderby'        => 'menu_order title',
				'order'          => 'ASC',
				'tax_query'      => array( array( 'taxonomy' => 'secao', 'field' => 'term_id', 'terms' => $s->term_id ) ), // phpcs:ignore WordPress.DB.SlowDBQuery
			) );
			while ( $q->have_posts() ) {
				$q->the_post();
				get_template_part( 'template-parts/card-prato' );
			}
			wp_reset_postdata();
			?>
		</div>
	</div>
</section>
<?php endforeach; ?>
<?php
get_template_part( 'template-parts/reserva' );
get_footer();
