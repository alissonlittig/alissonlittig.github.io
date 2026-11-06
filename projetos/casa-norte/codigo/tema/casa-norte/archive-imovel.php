<?php
/**
 * Listings archive with filters. The query is already filtered by pre_get_posts.
 *
 * @package casanorte
 */

get_header();
global $wp_query;
?>
<section class="page-head">
	<div class="wrap">
		<p class="eyebrow">Imóveis</p>
		<h1>Encontre o seu</h1>
		<?php get_template_part( 'template-parts/filtro' ); ?>
	</div>
</section>
<section class="section">
	<div class="wrap">
		<p class="result-count" role="status" aria-live="polite"><span id="count"><?php echo (int) $wp_query->found_posts; ?></span> imóveis encontrados</p>
		<div class="listing-grid" id="listings">
			<?php
			while ( have_posts() ) {
				the_post();
				get_template_part( 'template-parts/card-imovel' );
			}
			?>
		</div>
		<p class="empty" id="empty" <?php echo have_posts() ? 'hidden' : ''; ?>>Nenhum imóvel com esses filtros. <a href="<?php echo esc_url( get_post_type_archive_link( 'imovel' ) ); ?>">Limpar busca</a></p>
	</div>
</section>
<?php
get_template_part( 'template-parts/contato' );
get_footer();
