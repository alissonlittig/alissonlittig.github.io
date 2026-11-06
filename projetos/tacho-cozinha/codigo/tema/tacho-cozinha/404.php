<?php
/**
 * Not found.
 *
 * @package tacho
 */

get_header();
?>
<section class="page-head center">
	<div class="wrap">
		<p class="eyebrow">Erro 404</p>
		<h1>Essa panela está vazia.</h1>
		<p class="lead">A página que você procura não existe mais ou mudou de lugar.</p>
		<p><a class="btn" href="<?php echo esc_url( home_url( '/' ) ); ?>">Voltar ao início</a></p>
	</div>
</section>
<?php
get_footer();
