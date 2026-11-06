<?php
/**
 * Not found.
 *
 * @package casanorte
 */

get_header();
?>
<section class="page-head center">
	<div class="wrap">
		<p class="eyebrow">Erro 404</p>
		<h1>Esse endereço não existe.</h1>
		<p class="lead">A página que você procura saiu do ar ou mudou de lugar.</p>
		<p><a class="btn" href="<?php echo esc_url( get_post_type_archive_link( 'imovel' ) ); ?>">Ver os imóveis</a></p>
	</div>
</section>
<?php
get_footer();
